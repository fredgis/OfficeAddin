import { PublicClientApplication } from '@azure/msal-browser';
import { loginRequest, msalConfig } from './msalConfig';

/**
 * Interactive fallback authentication using a browser popup.
 * This avoids Office Dialog API security-zone issues in Office on the web.
 */
export async function openAuthDialog(): Promise<string> {
  try {
    const msal = new PublicClientApplication(msalConfig);
    await msal.initialize();

    const loginResponse = await msal.loginPopup(loginRequest);
    if (loginResponse.accessToken) {
      return loginResponse.accessToken;
    }

    const account = loginResponse.account ?? msal.getActiveAccount() ?? msal.getAllAccounts()[0];
    if (!account) {
      throw new Error('No signed-in account returned by Microsoft Entra ID');
    }

    const tokenResponse = await msal.acquireTokenSilent({
      ...loginRequest,
      account,
    });

    return tokenResponse.accessToken;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Interactive sign-in failed';
    throw new Error(`Sign-in popup failed: ${message}`);
  }
}
