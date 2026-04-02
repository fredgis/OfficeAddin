import { validateToken } from '../../middleware/authMiddleware';

// Helper to build a JWT-like token with a given payload
function buildMockToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64');
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

describe('Auth Middleware — validateToken', () => {
  beforeEach(() => {
    process.env.ENTRA_CLIENT_ID = 'test-client-id';
    process.env.ENTRA_TENANT_ID = 'test-tenant-id';
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
    const token = buildMockToken(payload);
    const request = createMockRequest(`Bearer ${token}`);

    const result = await validateToken(request);

    expect(result.token).toBe(token);
    expect(result.userId).toBe('user-object-id');
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

  it('throws when token audience does not match client ID', async () => {
    const payload = {
      aud: 'wrong-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
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
    const token = buildMockToken(payload);
    const request = createMockRequest(`Bearer ${token}`);

    const result = await validateToken(request);
    expect(result.userId).toBe('user-subject-only');
  });
});
