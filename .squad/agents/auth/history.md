# Auth — History

## What I Know About This Project

- Entra ID app registration needed with 3 API permissions (Power BI, OpenAI, Graph)
- SSO via OfficeRuntime.auth.getAccessToken() as first attempt
- Fallback: Office Dialog API → MSAL.js interactive login → messageParent(token)
- Backend OBO exchange: bootstrap token → Power BI token + OpenAI token
- Exposed API scope: api://<client-id>/access_as_user
- Tokens stored in memory only, never localStorage
