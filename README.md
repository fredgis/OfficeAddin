# PowerPoint Office Add-in for Microsoft Fabric & Power BI

A PowerPoint Office Add-in that integrates with Microsoft Fabric and Power BI to browse workspaces, export report pages as images, insert them into slides, and generate AI-powered executive insights.

## Documentation

- [Implementation Plan](docs/plan.md) — Full phased plan with architecture, auth flows, and technical details
- [Task Dependencies](docs/dependencies.md) — Dependency graph, critical path, Gantt chart (Mermaid diagrams)
- [Effort & Cost Estimation](docs/estimation.md) — Role split, effort estimates, Azure costs, and agent fleet savings

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Office.js + Fluent UI v9 |
| Backend | Azure Functions (Node.js/TypeScript) |
| Auth | MSAL.js + Entra ID (SSO + OBO flow) |
| AI | Azure OpenAI (GPT-4o) |
| Hosting | Azure Static Web Apps |
| Deployment | Azure Developer CLI (`azd`) + GitHub Actions |

## Getting Started

> 🚧 Project is in planning phase. See the [Implementation Plan](docs/plan.md) for details.