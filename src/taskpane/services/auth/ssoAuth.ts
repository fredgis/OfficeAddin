/**
 * Office.js SSO authentication.
 * Attempts to get a bootstrap token via OfficeRuntime.auth.getAccessToken().
 * This token is scoped to the add-in's API and sent to the backend for OBO exchange.
 */
export async function trySSOAuth(options?: { allowPrompt?: boolean }): Promise<string | null> {
  try {
    const token = await OfficeRuntime.auth.getAccessToken({
      allowSignInPrompt: options?.allowPrompt ?? false,
      allowConsentPrompt: options?.allowPrompt ?? false,
      forMSGraphAccess: false,
    });
    return token;
  } catch (error) {
    console.warn('SSO failed, will use dialog fallback:', error);
    return null;
  }
}
