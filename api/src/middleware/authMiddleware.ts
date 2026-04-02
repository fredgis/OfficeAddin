import { HttpRequest } from '@azure/functions';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export interface AuthenticatedRequest {
  token: string;
  userId?: string;
}

// JWKS client for verifying token signatures against Microsoft's public keys
const jwks = jwksClient({
  jwksUri: 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
  cache: true,
  cacheMaxAge: 86_400_000, // 24 hours
});

function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    jwks.getSigningKey(kid, (err, key) => {
      if (err || !key) return reject(err || new Error('Signing key not found'));
      resolve(key.getPublicKey());
    });
  });
}

/**
 * Extract, verify, and validate the bearer token from the incoming request.
 * Verifies the JWT signature against Microsoft's JWKS keys and validates
 * audience and issuer claims so only tokens issued for this application
 * by the expected tenant are accepted.
 */
export async function validateToken(request: HttpRequest): Promise<AuthenticatedRequest> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token');
  }

  const clientId = process.env.ENTRA_CLIENT_ID || '';
  const tenantId = process.env.ENTRA_TENANT_ID || '';

  // Decode header to get the key id (kid) for signature verification
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === 'string') {
    throw new Error('Malformed token');
  }

  // Verify signature against Microsoft's JWKS
  let payload: jwt.JwtPayload;
  try {
    const signingKey = await getSigningKey(decoded.header.kid!);
    payload = jwt.verify(token, signingKey, { algorithms: ['RS256'] }) as jwt.JwtPayload;
  } catch (err) {
    throw new Error(`Token verification failed: ${(err as Error).message}`);
  }

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

  // Check expiration (also validated by jwt.verify, kept as defense-in-depth)
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
