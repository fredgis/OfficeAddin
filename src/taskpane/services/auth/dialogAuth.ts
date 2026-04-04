import { PublicClientApplication } from '@azure/msal-browser';
import { interactiveLoginRequest, loginRequest, msalConfig } from './msalConfig';
import { hasJwtShape, parseJwtHeader, parseJwtPayload } from './tokenUtils';

function validateJwtAlgorithm(token: string): void {
  const header = parseJwtHeader(token);
  const payload = parseJwtPayload(token);
  const algorithm = typeof header?.alg === 'string' ? header.alg : 'unknown';
  const tokenType = typeof header?.typ === 'string' ? header.typ : 'unknown';
  const audience = typeof payload?.aud === 'string' ? payload.aud : 'unknown';
  if (algorithm !== 'RS256') {
    throw new Error(
      `Microsoft Entra ID returned an unexpected token algorithm: ${algorithm} (typ: ${tokenType}, aud: ${audience})`
    );
  }
}

/**
 * Interactive fallback authentication using a browser popup.
 * This avoids Office Dialog API security-zone issues in Office on the web.
 */
export async function openAuthDialog(): Promise<string> {
  try {
    const msal = new PublicClientApplication(msalConfig);
    await msal.initialize();

    let account = msal.getActiveAccount() ?? msal.getAllAccounts()[0] ?? null;

    if (!account) {
      const loginResponse = await msal.loginPopup(interactiveLoginRequest);
      account = loginResponse.account ?? msal.getActiveAccount() ?? msal.getAllAccounts()[0] ?? null;
    }

    if (!account) {
      throw new Error('No signed-in account returned by Microsoft Entra ID');
    }

    msal.setActiveAccount(account);

    try {
      const silentToken = await msal.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      if (hasJwtShape(silentToken.accessToken)) {
        validateJwtAlgorithm(silentToken.accessToken);
        return silentToken.accessToken;
      }
    } catch {
      // Fall through to an interactive token popup for the add-in API scope.
    }

    const tokenResponse = await msal.acquireTokenPopup({
      ...loginRequest,
      account,
    });

    if (!hasJwtShape(tokenResponse.accessToken)) {
      throw new Error('Microsoft Entra ID returned a non-JWT access token for the add-in API');
    }

    validateJwtAlgorithm(tokenResponse.accessToken);

    return tokenResponse.accessToken;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Interactive sign-in failed';
    throw new Error(`Sign-in popup failed: ${message}`);
  }
}
