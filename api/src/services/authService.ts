import { ConfidentialClientApplication, OnBehalfOfRequest } from '@azure/msal-node';

// ── Scopes for downstream APIs ──────────────────────────────────────────────
export const POWER_BI_SCOPE = 'https://analysis.windows.net/powerbi/api/.default';
export const OPENAI_SCOPE = 'https://cognitiveservices.azure.com/.default';

// ── Singleton MSAL ConfidentialClient ───────────────────────────────────────
let msalClient: ConfidentialClientApplication | null = null;

function getMsalClient(): ConfidentialClientApplication {
  if (!msalClient) {
    msalClient = new ConfidentialClientApplication({
      auth: {
        // Client secret should be stored in Azure Key Vault and referenced via App Settings
        clientId: process.env.ENTRA_CLIENT_ID || '',
        clientSecret: process.env.ENTRA_CLIENT_SECRET || '',
        authority: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID || ''}`,
      },
    });
  }
  return msalClient;
}

// ── OBO helpers ─────────────────────────────────────────────────────────────

async function exchangeObo(userToken: string, scope: string): Promise<string> {
  const client = getMsalClient();
  const oboRequest: OnBehalfOfRequest = {
    oboAssertion: userToken,
    scopes: [scope],
  };
  const response = await client.acquireTokenOnBehalfOf(oboRequest);
  if (!response || !response.accessToken) {
    throw new Error(`OBO token exchange failed for scope ${scope}`);
  }
  return response.accessToken;
}

/** Exchange user token for a Power BI access token via OBO. */
export async function exchangeForPowerBIToken(userToken: string): Promise<string> {
  return exchangeObo(userToken, POWER_BI_SCOPE);
}

/** Exchange user token for an Azure OpenAI access token via OBO. */
export async function exchangeForOpenAIToken(userToken: string): Promise<string> {
  return exchangeObo(userToken, OPENAI_SCOPE);
}
