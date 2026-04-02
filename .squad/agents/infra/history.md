# Infra — History

## What I Know About This Project

- Hosting: Azure Static Web Apps (frontend + integrated Azure Functions)
- Azure resources: SWA, Key Vault, Azure OpenAI, Application Insights
- Deployment: Azure Developer CLI (azd) with Bicep templates
- CI/CD: GitHub Actions for lint/build/test on PR, deploy on merge to main
- Monthly cost estimate: $41-$191 (OpenAI is dominant cost driver)
- Manifest deployment: sideload for dev, M365 Admin Center for production
