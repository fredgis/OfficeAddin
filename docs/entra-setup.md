# Entra ID App Registration Setup

Step-by-step guide for configuring Azure Entra ID (Azure AD) for **Fabric Storyboard Copilot**.

## 1. Register the Application

1. Go to [Azure Portal → Entra ID → App registrations](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps).
2. Click **New registration**.
3. Fill in:
   - **Name**: `Fabric Storyboard Copilot`
   - **Supported account types**: *Accounts in this organizational directory only* (single-tenant)
   - **Redirect URI**: Leave blank for now (configured in step 2).
4. Click **Register** and note the **Application (client) ID** and **Directory (tenant) ID**.

## 2. Configure Redirect URIs

1. Go to **Authentication** → **Add a platform** → **Single-page application**.
2. Add the following redirect URIs:

| Environment | Redirect URI |
|---|---|
| Development | `https://localhost:3000/dialog.html` |
| Production | `https://<swa-domain>/dialog.html` |

3. Under **Implicit grant and hybrid flows**, ensure **Access tokens** and **ID tokens** are **unchecked** (we use auth-code + PKCE via MSAL).

## 3. Add API Permissions

1. Go to **API permissions** → **Add a permission**.
2. Add the following permissions:

| API | Permission | Type |
|---|---|---|
| Microsoft Graph | `User.Read` | Delegated |
| Power BI Service | `Report.Read.All` | Delegated |
| Power BI Service | `Workspace.Read.All` | Delegated |
| Power BI Service | `Dataset.Read.All` | Delegated |
| Azure Cognitive Services | `user_impersonation` | Delegated |

3. Click **Grant admin consent for \<tenant\>** (requires Global Admin or Privileged Role Administrator).

> **Note:** The backend requests `https://analysis.windows.net/powerbi/api/.default` during the OBO flow, which expands to the delegated Power BI permissions granted on the app registration. For Azure OpenAI, the backend requests `https://cognitiveservices.azure.com/.default`. The frontend only requests `api://<client-id>/access_as_user`.

## 4. Expose an API

1. Go to **Expose an API**.
2. Click **Set** next to **Application ID URI** and set it to: `api://<client-id>` (replace `<client-id>` with your Application ID).
3. Click **Add a scope**:
   - **Scope name**: `access_as_user`
   - **Who can consent**: Admins and users
   - **Admin consent display name**: Access Fabric Storyboard Copilot as the signed-in user
   - **Admin consent description**: Allows the Office Add-in to call the backend API on behalf of the signed-in user.
   - **User consent display name**: Access Fabric Storyboard Copilot
   - **User consent description**: Allow the add-in to access Fabric Storyboard Copilot on your behalf.
   - **State**: Enabled
4. Under **Authorized client applications**, add the following Office client IDs and select the `access_as_user` scope:

| Client | Application ID |
|---|---|
| Office on the web | `ea5a67f6-b6f3-4338-b240-c655ddc3cc8e` |
| Office desktop (Windows) | `d3590ed6-52b3-4102-aeff-aad2292ab01c` |
| Outlook desktop / mobile | `bc59ab01-8403-45c6-8796-ac3ef710b3e3` |
| Office on the web (alternate) | `57fb890c-0dab-4253-a5e0-7188c88b2bb4` |
| Microsoft Teams | `1fec8e78-bce4-4aaf-ab1b-5451cc387264` |

## 5. Generate a Client Secret

1. Go to **Certificates & secrets** → **Client secrets** → **New client secret**.
2. Set a description (e.g., `fabric-storyboard-api`) and expiration (recommended: 6 months).
3. Copy the secret **Value** immediately — it won't be shown again.
4. Store the secret in **Azure Key Vault**, not in code or config files.

## 6. Environment Variables

Set the following environment variables in your Azure Functions (local: `local.settings.json`, production: SWA App Settings):

> ⚠️ **Important:** Azure Static Web Apps do **not** support `@Microsoft.KeyVault()` references in app settings (that is an App Service-only feature). Set secrets directly as SWA app settings via `az staticwebapp appsettings set`.

```
ENTRA_CLIENT_ID=<your-application-client-id>
ENTRA_TENANT_ID=<your-directory-tenant-id>
ENTRA_CLIENT_SECRET=<your-client-secret-value>
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

> **Note:** `AZURE_OPENAI_ENDPOINT` must be the base URL only (e.g., `https://myresource.openai.azure.com/`). Do **not** append `/openai/v1/` — the backend constructs the full path automatically.

For the frontend (set via webpack `DefinePlugin` or `.env`):

```
ENTRA_CLIENT_ID=<your-application-client-id>
ENTRA_TENANT_ID=<your-directory-tenant-id>
```

> **Security:** The client secret is only used in the backend (Azure Functions) for the OBO flow. It must **never** appear in frontend code.
