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
| AI | Azure OpenAI (GPT-4o) |
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

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com
AZURE_OPENAI_API_KEY=<your-api-key>
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
    "AZURE_OPENAI_API_KEY": "<your-api-key>",
    "AZURE_OPENAI_DEPLOYMENT": "gpt-4o"
  },
  "Host": {
    "CORS": "https://localhost:3000",
    "CORSCredentials": true
  }
}
```

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

### Using Azure Developer CLI

```bash
# Login to Azure
azd auth login

# Provision infrastructure + deploy
azd up

# Or separately:
azd provision   # Create Azure resources (Bicep)
azd deploy      # Deploy app code
```

This provisions:
- **Azure Static Web App** (frontend + integrated Azure Functions)
- **Azure Key Vault** (secrets: client secret, OpenAI API key)
- **Azure OpenAI** resource (GPT-4o deployment)
- **Application Insights** (telemetry and monitoring)

### Update manifest for production

After deployment, update `manifest.xml` to replace `https://localhost:3000` with your Static Web App URL:

```xml
<SourceLocation DefaultValue="https://<your-swa>.azurestaticapps.net/taskpane.html" />
```

### Admin Deployment

For organization-wide deployment:
1. Upload the updated `manifest.xml` to the **Microsoft 365 Admin Center** → **Integrated apps**
2. Or deploy via **Teams Admin Center** → **Manage apps**

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