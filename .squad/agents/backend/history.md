# Backend — History

## What I Know About This Project

- Azure Functions v4 with Node.js/TypeScript programming model
- 6 API endpoints: workspaces, reports, pages, export, insights, query
- Power BI REST API base: https://api.powerbi.com/v1.0/myorg/
- Export API requires async polling with exponential backoff (10-60s)
- OBO token exchange via MSAL ConfidentialClientApplication
- Azure OpenAI GPT-4o for insight generation with system prompt
