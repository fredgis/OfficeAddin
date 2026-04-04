# Deployment Guide — Fabric Storyboard Copilot

## Local Development (Sideloading)

1. **Install dependencies**

   ```bash
   npm install
   cd api && npm install && cd ..
   ```

2. **Start the dev server**

   ```bash
   npm start
   ```

   This starts webpack-dev-server on `https://localhost:3000` and the Azure Functions API on port 7071.

3. **Sideload in PowerPoint**

   - Open PowerPoint (desktop or web).
   - Go to **Insert → My Add-ins → Upload My Add-in**.
   - Browse to `manifest.xml` in the repo root and click **Upload**.
   - The add-in taskpane will appear using your local dev server.

> **Tip:** The manifest points to `https://localhost:3000` by default. No changes are needed for local development.

---

## Production Deployment

### 1. Provision Azure Infrastructure

Use the Azure Developer CLI (`azd`) to provision resources:

```bash
azd auth login
azd up
```

This deploys:
- **Azure Static Web App** (Standard tier) — hosts the frontend and API, with system-assigned Managed Identity
- **Azure Key Vault** — stores Entra client secret
- **Application Insights + Log Analytics** — monitoring and diagnostics
- **RBAC role assignment** — `Cognitive Services OpenAI User` on the OpenAI resource for the SWA Managed Identity

Configure environment variables when prompted, or set them in `.azure/<env>/.env`:

```
AZURE_LOCATION=eastus2
ENTRA_CLIENT_ID=<your-client-id>
ENTRA_TENANT_ID=<your-tenant-id>
ENTRA_CLIENT_SECRET=<your-client-secret>
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

> ⚠️ **Critical SWA limitation:** Azure Static Web Apps do **not** support `@Microsoft.KeyVault()` references in app settings. Set `ENTRA_CLIENT_SECRET` directly as a plain value via `az staticwebapp appsettings set`.

> **Note:** `AZURE_OPENAI_ENDPOINT` must be the base URL only (e.g., `https://myresource.openai.azure.com/`). Do **not** include `/openai/v1/` — the backend appends the full path automatically.

> **No API key needed for Azure OpenAI.** The Static Web App's system-assigned Managed Identity is automatically granted the `Cognitive Services OpenAI User` role via Bicep RBAC.

### 2. Deploy with SWA CLI

When deploying manually with the SWA CLI, always include the API language flags:

```bash
npx @azure/static-web-apps-cli deploy \
  --app-location ./dist \
  --api-location ./api \
  --api-language node \
  --api-version 18 \
  --deployment-token <your-token>
```

> Without `--api-language node --api-version 18`, the API layer will **not** be deployed and all `/api/*` calls will return 404.

### 2. Update manifest.xml for Production

After deployment, update `manifest.xml` to replace localhost URLs with your Static Web App domain:

| Find | Replace with |
|------|-------------|
| `https://localhost:3000` | `https://<your-swa>.azurestaticapps.net` |

For example:
```xml
<SourceLocation DefaultValue="https://your-app.azurestaticapps.net/taskpane.html" />
```

Update all `<SourceLocation>`, `<bt:Url>`, and icon URL references accordingly.

### 3. CI/CD (GitHub Actions)

Two workflows are provided:

- **CI** (`.github/workflows/ci.yml`) — runs on every PR and push to `main`. Lints, builds, and tests both frontend and API.
- **Deploy** (`.github/workflows/deploy.yml`) — deploys to Azure Static Web Apps on push to `main`.

**Required secret:** Add `AZURE_STATIC_WEB_APPS_API_TOKEN` to your GitHub repository secrets (Settings → Secrets and variables → Actions). Retrieve the token from the Azure Portal under your Static Web App → Manage deployment token.

---

## Admin Deployment via M365 Admin Center

To make the add-in available to all users in your organization:

1. **Export the production manifest** — ensure all URLs point to your SWA domain.
2. Go to the [Microsoft 365 Admin Center](https://admin.microsoft.com).
3. Navigate to **Settings → Integrated apps → Upload custom apps**.
4. Upload the updated `manifest.xml`.
5. Assign the add-in to the desired users or groups.
6. Users will see the add-in in PowerPoint under **Insert → My Add-ins → Admin Managed**.

> **Note:** It may take up to 24 hours for the add-in to appear for all assigned users.
