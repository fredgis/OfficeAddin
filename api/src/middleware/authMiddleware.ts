import { HttpRequest } from '@azure/functions';
import axios from 'axios';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest {
  token: string;
  userId?: string;
}

interface JwksKey {
  kid?: string;
  x5t?: string;
  x5c?: string[];
}

interface JwtHeader {
  [key: string]: unknown;
  kid?: string;
  x5t?: string;
  alg?: string;
  typ?: string;
}

const JWKS_URI = 'https://login.microsoftonline.com/common/discovery/v2.0/keys';
const JWKS_CACHE_TTL_MS = 86_400_000;
const EXPECTED_TOKEN_ALGORITHM = 'RS256';
const CUSTOM_AUTH_HEADER = 'x-fabric-storyboard-authorization';

const keyCache = new Map<string, { keys: Map<string, string>; expiresAt: number }>();

function formatCertificatePem(certificate: string): string {
  const wrapped = certificate.match(/.{1,64}/g)?.join('\n') ?? certificate;
  return `-----BEGIN CERTIFICATE-----\n${wrapped}\n-----END CERTIFICATE-----`;
}

function decodeJwtSection<T extends Record<string, unknown>>(segment: string, label: string): T {
  try {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const parsed = JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as unknown;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Decoded section is not an object');
    }

    return parsed as T;
  } catch {
    throw new Error(`Malformed token ${label}`);
  }
}

function extractTenantId(issuer?: string): string | undefined {
  if (!issuer) {
    return undefined;
  }

  const match = issuer.match(/^https:\/\/[^/]+\/([^/]+)/i);
  return match?.[1];
}

function getJwksUris(tokenTenantId?: string, issuer?: string): string[] {
  const tenantId = tokenTenantId || extractTenantId(issuer);
  const uris = [];

  if (tenantId) {
    uris.push(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`);
  }

  uris.push(JWKS_URI);
  return [...new Set(uris)];
}

async function loadSigningKeys(jwksUri: string): Promise<Map<string, string>> {
  const cached = keyCache.get(jwksUri);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.keys;
  }

  const response = await axios.get<{ keys?: JwksKey[] }>(jwksUri, { timeout: 10_000 });
  const keys = new Map<string, string>();

  for (const key of response.data.keys ?? []) {
    const certificate = key.x5c?.[0];
    if (!certificate) {
      continue;
    }

    const pem = formatCertificatePem(certificate);
    if (key.kid) {
      keys.set(key.kid, pem);
    }
    if (key.x5t) {
      keys.set(key.x5t, pem);
    }
  }

  keyCache.set(jwksUri, { keys, expiresAt: Date.now() + JWKS_CACHE_TTL_MS });
  return keys;
}

async function getSigningKey(keyId: string, tokenTenantId?: string, issuer?: string): Promise<string> {
  for (const jwksUri of getJwksUris(tokenTenantId, issuer)) {
    const keys = await loadSigningKeys(jwksUri);
    const signingKey = keys.get(keyId);
    if (signingKey) {
      return signingKey;
    }
  }

  throw new Error('Signing key not found');
}

async function getSigningKeys(tokenTenantId?: string, issuer?: string): Promise<string[]> {
  const signingKeys = new Set<string>();

  for (const jwksUri of getJwksUris(tokenTenantId, issuer)) {
    const keys = await loadSigningKeys(jwksUri);
    for (const pem of keys.values()) {
      signingKeys.add(pem);
    }
  }

  return [...signingKeys];
}

function verifyWithSigningKeys(token: string, signingKeys: string[], algorithm?: string): jwt.JwtPayload {
  if (!algorithm) {
    throw new Error('Missing token signing algorithm');
  }

  if (algorithm !== EXPECTED_TOKEN_ALGORITHM) {
    throw new Error(`Unsupported token signing algorithm: ${algorithm}`);
  }

  let lastError: Error | null = null;

  for (const signingKey of signingKeys) {
    try {
      return jwt.verify(token, signingKey, { algorithms: [EXPECTED_TOKEN_ALGORITHM] }) as jwt.JwtPayload;
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw new Error(lastError?.message || 'Signing key not found');
}

function getTokenVerificationContext(header: JwtHeader, payload: jwt.JwtPayload): string {
  const tokenType = typeof header.typ === 'string' ? header.typ : 'unknown';
  const audience = typeof payload.aud === 'string' ? payload.aud : 'unknown';
  return `(typ: ${tokenType}, aud: ${audience})`;
}

function extractTokenFromHeaders(request: HttpRequest): string {
  const customHeaderValue = request.headers.get(CUSTOM_AUTH_HEADER)?.trim();
  if (customHeaderValue) {
    return customHeaderValue.startsWith('Bearer ') ? customHeaderValue.substring(7) : customHeaderValue;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error(`Missing or invalid access token header (expected ${CUSTOM_AUTH_HEADER} or Authorization: Bearer)`);
  }

  return authHeader.substring(7);
}

/**
 * Extract, verify, and validate the bearer token from the incoming request.
 * Verifies the JWT signature against Microsoft's JWKS keys and validates
 * audience and issuer claims so only tokens issued for this application
 * by the expected tenant are accepted.
 */
export async function validateToken(request: HttpRequest): Promise<AuthenticatedRequest> {
  const token = extractTokenFromHeaders(request);

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error(`Malformed token: expected 3 segments, received ${parts.length}`);
  }

  const clientId = process.env.ENTRA_CLIENT_ID || '';
  const tenantId = process.env.ENTRA_TENANT_ID || '';

  const header = decodeJwtSection<JwtHeader>(parts[0], 'header');
  const decodedPayload = decodeJwtSection<jwt.JwtPayload>(parts[1], 'payload');
  const keyId = header.kid || header.x5t;
  const tokenContext = getTokenVerificationContext(header, decodedPayload);

  // Verify signature against Microsoft's JWKS
  let payload: jwt.JwtPayload;
  try {
    const signingKeys = keyId
      ? [
          await getSigningKey(
            keyId,
            decodedPayload.tid as string | undefined,
            decodedPayload.iss as string | undefined,
          ),
        ]
      : await getSigningKeys(decodedPayload.tid as string | undefined, decodedPayload.iss as string | undefined);

    if (signingKeys.length === 0) {
      throw new Error('Signing key not found');
    }

    payload = verifyWithSigningKeys(token, signingKeys, typeof header.alg === 'string' ? header.alg : undefined);
  } catch (err) {
    const message = (err as Error).message;
    const enrichedMessage = message.startsWith('Unsupported token signing algorithm:')
      ? `${message} ${tokenContext}`
      : message;
    throw new Error(
      enrichedMessage.startsWith('Token verification failed:')
        ? enrichedMessage
        : `Token verification failed: ${enrichedMessage}`
    );
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
