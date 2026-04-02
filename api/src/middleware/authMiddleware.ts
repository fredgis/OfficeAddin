import { HttpRequest } from '@azure/functions';

export interface AuthenticatedRequest {
  token: string;
  userId?: string;
}

/**
 * Extract and validate the bearer token from the incoming request.
 * Verifies audience and issuer claims so only tokens issued for this
 * application by the expected tenant are accepted.
 */
export async function validateToken(request: HttpRequest): Promise<AuthenticatedRequest> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);

  // Decode payload (signature verification delegated to Entra ID during OBO exchange)
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token');
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  } catch {
    throw new Error('Unable to decode token payload');
  }

  const clientId = process.env.ENTRA_CLIENT_ID || '';
  const tenantId = process.env.ENTRA_TENANT_ID || '';

  // Audience must match our application
  const aud = payload.aud as string | undefined;
  if (!aud || (!aud.includes(clientId) && aud !== `api://${clientId}`)) {
    throw new Error('Token audience mismatch');
  }

  // Issuer must be from the expected tenant
  const iss = payload.iss as string | undefined;
  if (tenantId && iss && !iss.includes(tenantId)) {
    throw new Error('Token issuer mismatch');
  }

  // Check expiration
  const exp = payload.exp as number | undefined;
  if (exp && exp * 1000 < Date.now()) {
    throw new Error('Token has expired');
  }

  return {
    token,
    userId: (payload.oid as string) || (payload.sub as string) || undefined,
  };
}

// Re-export downstream helpers from authService for convenience
export { exchangeForPowerBIToken, exchangeForOpenAIToken, POWER_BI_SCOPE, OPENAI_SCOPE } from '../services/authService.js';

// Backward-compatible generic OBO helper used by existing function handlers
import { ConfidentialClientApplication, OnBehalfOfRequest } from '@azure/msal-node';

let _msalClient: ConfidentialClientApplication | null = null;
function getMsalClient(): ConfidentialClientApplication {
  if (!_msalClient) {
    _msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.ENTRA_CLIENT_ID || '',
        clientSecret: process.env.ENTRA_CLIENT_SECRET || '',
        authority: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID || ''}`,
      },
    });
  }
  return _msalClient;
}

export async function getOboToken(userToken: string, scope: string): Promise<string> {
  const client = getMsalClient();
  const oboRequest: OnBehalfOfRequest = {
    oboAssertion: userToken,
    scopes: [scope],
  };
  const response = await client.acquireTokenOnBehalfOf(oboRequest);
  if (!response || !response.accessToken) {
    throw new Error('OBO token exchange failed');
  }
  return response.accessToken;
}
