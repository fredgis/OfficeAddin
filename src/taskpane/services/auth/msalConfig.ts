import { Configuration, LogLevel } from '@azure/msal-browser';

// Replace with your Entra ID app registration values
const CLIENT_ID = process.env.ENTRA_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const TENANT_ID = process.env.ENTRA_TENANT_ID || 'YOUR_TENANT_ID_HERE';

export const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: `${window.location.origin}/dialog.html`,
  },
  cache: {
    // Tokens kept in memory only — never persisted to localStorage/sessionStorage
    cacheLocation: 'memoryStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      loggerCallback: (_level, message) => console.log(`MSAL: ${message}`),
    },
  },
};

/** Scopes for the add-in's own backend API. */
export const loginRequest = {
  scopes: [`api://${CLIENT_ID}/access_as_user`],
};

/** Scopes for Power BI REST API (used in OBO on the backend). */
export const powerBiScopes = {
  scopes: ['https://analysis.windows.net/powerbi/api/.default'],
};
