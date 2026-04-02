/**
 * Office.js SSO authentication.
 * Attempts to get a bootstrap token via OfficeRuntime.auth.getAccessToken().
 * This token is scoped to the add-in's API and sent to the backend for OBO exchange.
 */
export async function trySSOAuth(): Promise<string | null> {
  try {
    const token = await OfficeRuntime.auth.getAccessToken({
      allowSignInPrompt: true,
      allowConsentPrompt: true,
      forMSGraphAccess: false,
    });
    return token;
  } catch (error) {
    console.warn('SSO failed, will use dialog fallback:', error);
    return null;
  }
}
