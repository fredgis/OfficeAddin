// Mock jsonwebtoken and jwks-rsa to skip actual JWKS network calls in tests
jest.mock('jwks-rsa', () => {
  return jest.fn().mockReturnValue({
    getSigningKey: jest.fn((_kid: string, cb: (err: Error | null, key?: { getPublicKey: () => string }) => void) => {
      cb(null, { getPublicKey: () => 'mock-public-key' });
    }),
  });
});

jest.mock('jsonwebtoken', () => ({
  decode: jest.fn(),
  verify: jest.fn(),
}));

import { validateToken } from '../../middleware/authMiddleware';
import jwt from 'jsonwebtoken';

// Helper to build a JWT-like token with a given payload
function buildMockToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test-kid' })).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = 'mock-signature';
  return `${header}.${body}.${signature}`;
}

function createMockRequest(authHeader?: string) {
  return {
    headers: {
      get: jest.fn((name: string) => {
        if (name.toLowerCase() === 'authorization') return authHeader;
        return null;
      }),
    },
  } as unknown as import('@azure/functions').HttpRequest;
}

function mockJwtSuccess(payload: Record<string, unknown>) {
  (jwt.decode as jest.Mock).mockReturnValue({
    header: { alg: 'RS256', kid: 'test-kid' },
    payload,
  });
  (jwt.verify as jest.Mock).mockReturnValue(payload);
}

function mockJwtDecodeOnly(payload: Record<string, unknown>) {
  (jwt.decode as jest.Mock).mockReturnValue({
    header: { alg: 'RS256', kid: 'test-kid' },
    payload,
  });
  // verify also returns the payload (claim validation is done manually)
  (jwt.verify as jest.Mock).mockReturnValue(payload);
}

function mockJwtVerifyFailure(message: string) {
  (jwt.decode as jest.Mock).mockReturnValue({
    header: { alg: 'RS256', kid: 'test-kid' },
    payload: {},
  });
  (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error(message); });
}

describe('Auth Middleware — validateToken', () => {
  beforeEach(() => {
    process.env.ENTRA_CLIENT_ID = 'test-client-id';
    process.env.ENTRA_TENANT_ID = 'test-tenant-id';
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.ENTRA_CLIENT_ID;
    delete process.env.ENTRA_TENANT_ID;
  });

  it('returns token and userId for a valid token', async () => {
    const payload = {
      aud: 'test-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600,
      oid: 'user-object-id',
      sub: 'user-subject',
    };
    mockJwtSuccess(payload);
    const token = buildMockToken(payload);
    const request = createMockRequest(`Bearer ${token}`);

    const result = await validateToken(request);

    expect(result.token).toBe(token);
    expect(result.userId).toBe('user-object-id');
    expect(jwt.verify).toHaveBeenCalledWith(token, 'mock-public-key', { algorithms: ['RS256'] });
  });

  it('throws when authorization header is missing', async () => {
    const request = createMockRequest(undefined);

    await expect(validateToken(request)).rejects.toThrow(/Missing or invalid authorization header/);
  });

  it('throws when authorization header is not Bearer', async () => {
    const request = createMockRequest('Basic abc123');

    await expect(validateToken(request)).rejects.toThrow(/Missing or invalid authorization header/);
  });

  it('throws for a malformed token (not 3 parts)', async () => {
    const request = createMockRequest('Bearer not-a-valid-jwt');

    await expect(validateToken(request)).rejects.toThrow(/Malformed token/);
  });

  it('throws when JWT signature verification fails', async () => {
    mockJwtVerifyFailure('invalid signature');
    const token = buildMockToken({ aud: 'test-client-id' });
    const request = createMockRequest(`Bearer ${token}`);

    await expect(validateToken(request)).rejects.toThrow(/Token verification failed/);
  });

  it('throws when token audience does not match client ID', async () => {
    const payload = {
      aud: 'wrong-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    mockJwtDecodeOnly(payload);
    const token = buildMockToken(payload);
    const request = createMockRequest(`Bearer ${token}`);

    await expect(validateToken(request)).rejects.toThrow(/Token audience mismatch/);
  });

  it('accepts api:// audience format', async () => {
    const payload = {
      aud: 'api://test-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600,
      sub: 'user-sub',
    };
    mockJwtSuccess(payload);
    const token = buildMockToken(payload);
    const request = createMockRequest(`Bearer ${token}`);

    const result = await validateToken(request);
    expect(result.token).toBe(token);
    expect(result.userId).toBe('user-sub');
  });

  it('throws when token issuer does not match tenant', async () => {
    const payload = {
      aud: 'test-client-id',
      iss: 'https://login.microsoftonline.com/wrong-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    mockJwtDecodeOnly(payload);
    const token = buildMockToken(payload);
    const request = createMockRequest(`Bearer ${token}`);

    await expect(validateToken(request)).rejects.toThrow(/Token issuer mismatch/);
  });

  it('throws when token has expired', async () => {
    const payload = {
      aud: 'test-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      oid: 'user-oid',
    };
    mockJwtDecodeOnly(payload);
    const token = buildMockToken(payload);
    const request = createMockRequest(`Bearer ${token}`);

    await expect(validateToken(request)).rejects.toThrow(/Token has expired/);
  });

  it('falls back to sub when oid is missing', async () => {
    const payload = {
      aud: 'test-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600,
      sub: 'user-subject-only',
    };
    mockJwtSuccess(payload);
    const token = buildMockToken(payload);
    const request = createMockRequest(`Bearer ${token}`);

    const result = await validateToken(request);
    expect(result.userId).toBe('user-subject-only');
  });
});
