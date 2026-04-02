# Fabric Storyboard Copilot

A PowerPoint Office Add-in that integrates with Microsoft Fabric and Power BI to browse workspaces, export report pages as images, insert them into slides, and generate AI-powered executive insights.

## Documentation

- [Architecture](docs/architecture.md) — System architecture, component diagrams, data flows (Mermaid)
- [Implementation Plan](docs/plan.md) — Full phased plan with architecture, auth flows, and technical details
- [Entra ID Setup](docs/entra-setup.md) — App registration and permission configuration
- [Task Dependencies](docs/dependencies.md) — Dependency graph, critical path, Gantt chart (Mermaid diagrams)
- [Effort & Cost Estimation](docs/estimation.md) — Role split, effort estimates, Azure costs, and agent fleet savings

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Office.js + Fluent UI v9 |
| Backend | Azure Functions (Node.js v4 / TypeScript) |
| Auth | MSAL.js + Entra ID (SSO + OBO flow) |
| AI | Azure OpenAI (GPT-4o) via Managed Identity |
| Data | Power BI REST API + Export API |
| Hosting | Azure Static Web Apps |
| IaC | Bicep + Azure Developer CLI (`azd`) |
| CI/CD | GitHub Actions |

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) v9 or later
- [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local) v4
- [Azure Developer CLI (`azd`)](https://learn.microsoft.com/azure/developer/azure-developer-cli/install-azd)
- [PowerPoint](https://www.microsoft.com/microsoft-365) (Desktop or Web) for sideloading
- An Azure subscription with:
  - An [Entra ID app registration](docs/entra-setup.md)
  - A Power BI workspace with at least one report
  - An Azure OpenAI resource with a GPT-4o deployment

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/OfficeAddin.git
cd OfficeAddin
```

### 2. Install dependencies

```bash
# Frontend dependencies
npm ci

# Backend dependencies
cd api
npm ci
cd ..
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
# Entra ID
ENTRA_CLIENT_ID=<your-app-client-id>
ENTRA_TENANT_ID=<your-tenant-id>
ENTRA_CLIENT_SECRET=<your-client-secret>

# Power BI (no extra config — uses OBO token)

# Azure OpenAI (no API key needed — uses Managed Identity in Azure, az login locally)
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

For the Azure Functions backend, create `api/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "ENTRA_CLIENT_ID": "<your-app-client-id>",
    "ENTRA_TENANT_ID": "<your-tenant-id>",
    "ENTRA_CLIENT_SECRET": "<your-client-secret>",
    "AZURE_OPENAI_ENDPOINT": "https://<your-resource>.openai.azure.com",
    "AZURE_OPENAI_DEPLOYMENT": "gpt-4o"
  },
  "Host": {
    "CORS": "https://localhost:3000",
    "CORSCredentials": true
  }
}
```

> **Note:** No `AZURE_OPENAI_API_KEY` is needed. The backend uses `DefaultAzureCredential` from `@azure/identity`, which automatically uses:
> - **Managed Identity** when deployed to Azure (via system-assigned identity on the Static Web App)
> - **Azure CLI / VS Code credentials** when running locally (requires `az login`)
>
> For local development, ensure you have the **Cognitive Services OpenAI User** role on your Azure OpenAI resource:
> ```bash
> az role assignment create \
>   --assignee <your-user-object-id-or-email> \
>   --role "Cognitive Services OpenAI User" \
>   --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<openai-resource>
> ```

### 4. Set up Entra ID App Registration

Follow the step-by-step guide in [docs/entra-setup.md](docs/entra-setup.md). You will need to:

1. Register an app in Azure Entra ID
2. Add redirect URIs (`https://localhost:3000/dialog.html`)
3. Add API permissions (Power BI, Graph, Cognitive Services)
4. Expose an API scope (`api://<client-id>/access_as_user`)
5. Generate a client secret

### 5. Run locally

In two terminals:

```bash
# Terminal 1 — Frontend (webpack dev server with HTTPS)
npm start
# Serves at https://localhost:3000

# Terminal 2 — Backend (Azure Functions)
cd api
npm start
# Serves at http://localhost:7071
```

### 6. Sideload the add-in in PowerPoint

#### PowerPoint Desktop (Windows)

1. Open PowerPoint
2. Go to **Insert** → **My Add-ins** → **Manage My Add-ins**
3. Click **Upload My Add-in**
4. Browse to `manifest.xml` in the project root
5. Click **Upload**

#### PowerPoint Desktop (Mac)

1. Open PowerPoint
2. Go to **Insert** → **My Add-ins** → **Manage My Add-ins**
3. Click **Upload My Add-in**
4. Browse to `manifest.xml`

#### PowerPoint Online

1. Go to [PowerPoint Online](https://www.office.com/launch/powerpoint)
2. Open a presentation
3. Go to **Insert** → **Office Add-ins** → **Upload My Add-in**
4. Browse to `manifest.xml`

After sideloading, the add-in appears in the **Home** ribbon tab. Click the button to open the taskpane.

## Available Scripts

### Frontend (root)

| Script | Command | Description |
|--------|---------|-------------|
| Start dev server | `npm start` | Webpack dev server with HTTPS on port 3000 |
| Build for production | `npm run build` | Webpack production bundle to `dist/` |
| Lint | `npm run lint` | ESLint check on `src/` |
| Test | `npm test` | Jest unit tests |

### Backend (`api/`)

| Script | Command | Description |
|--------|---------|-------------|
| Start Functions | `npm start` | Build + `func start` on port 7071 |
| Build | `npm run build` | TypeScript compilation |
| Watch | `npm run watch` | TypeScript watch mode |
| Test | `npm test` | Jest unit tests |

## Deploy to Azure

### 🚀 One-Click Automated Deployment (Recommended)

The `deploy.ps1` script automates the **entire** deployment pipeline — from Entra ID app registration to Azure infrastructure provisioning to app deployment:

```powershell
# Full interactive deployment (prompts for all values):
.\deploy.ps1

# Non-interactive with existing resources:
.\deploy.ps1 -EnvironmentName prod -Location westeurope `
    -EntraClientId "00000000-..." -EntraClientSecret "secret" `
    -OpenAiEndpoint "https://my-oai.openai.azure.com/"

# Skip tests for faster deployment:
.\deploy.ps1 -SkipTests
```

**What it does:**

| Step | Action |
|------|--------|
| 1 | Validates prerequisites (Node.js, npm, az, azd) |
| 2 | Authenticates with Azure (az login + azd auth) |
| 3 | Creates Entra ID app registration (or uses existing) |
| 4 | Installs dependencies, builds, and runs tests |
| 5 | Provisions Azure infrastructure via Bicep |
| 6 | Deploys app to Azure Static Web Apps |
| 7 | Generates production `manifest-prod.xml` |
| 8 | Configures `local.settings.json` and `.env` |
| 9 | Sets up RBAC for local development |

**Output:** The script prints the SWA URL and the production manifest path. Sideload `dist/manifest-prod.xml` in PowerPoint to start using the add-in.

---

### 📋 Manual Deployment

<details>
<summary>Click to expand manual deployment steps</summary>

#### Step 1: Set up Entra ID

Follow [docs/entra-setup.md](docs/entra-setup.md) to register an app, configure permissions, and generate a client secret.

#### Step 2: Provision with Azure Developer CLI

```bash
# Login to Azure
azd auth login

# Provision infrastructure + deploy
azd up

# Or separately:
azd provision   # Create Azure resources (Bicep)
azd deploy      # Deploy app code
```

Configure environment variables when prompted, or set them in `.azure/<env>/.env`:

```
AZURE_LOCATION=eastus2
ENTRA_CLIENT_ID=<your-client-id>
ENTRA_TENANT_ID=<your-tenant-id>
ENTRA_CLIENT_SECRET=<your-client-secret>
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

This provisions:
- **Azure Static Web App** (frontend + integrated Azure Functions) with **system-assigned Managed Identity**
- **Azure Key Vault** (secrets: Entra client secret) with **RBAC** for the SWA
- **Azure OpenAI** resource (optional — GPT-4o deployment) with **RBAC role assignment** (Cognitive Services OpenAI User → SWA Managed Identity)
- **Application Insights** (telemetry and monitoring)

> **No API keys for Azure OpenAI.** The Static Web App's managed identity is automatically granted the `Cognitive Services OpenAI User` role on the OpenAI resource via Bicep RBAC.

#### Step 3: Update manifest for production

After deployment, update `manifest.xml` to replace `https://localhost:3000` with your Static Web App URL:

```xml
<SourceLocation DefaultValue="https://<your-swa>.azurestaticapps.net/taskpane.html" />
```

Or use `sed` / PowerShell to generate a production manifest:

```powershell
(Get-Content manifest.xml) -replace 'https://localhost:3000', 'https://<your-swa>.azurestaticapps.net' |
    Set-Content dist/manifest-prod.xml
```

#### Step 4: Sideload or admin-deploy

For individual testing, sideload the manifest in PowerPoint (Insert → My Add-ins → Upload).

For organization-wide deployment:
1. Upload `manifest-prod.xml` to the **Microsoft 365 Admin Center** → **Integrated apps**
2. Or deploy via **Teams Admin Center** → **Manage apps**

</details>

## Project Structure

```
OfficeAddin/
├── src/taskpane/          # React frontend (components, hooks, services)
├── api/src/               # Azure Functions backend (endpoints, services)
├── infra/                 # Bicep IaC templates
├── docs/                  # Documentation
├── dist/                  # Build output
├── manifest.xml           # Office Add-in manifest
├── azure.yaml             # azd deployment config
├── webpack.config.js      # Frontend bundling
├── jest.config.js         # Test configuration
└── package.json           # Dependencies & scripts
```

See [docs/architecture.md](docs/architecture.md) for detailed component diagrams and data flows.

## License

Private — Microsoft Internal.