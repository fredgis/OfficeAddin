jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

import axios from 'axios';
import { validateToken } from '../../middleware/authMiddleware';
import jwt from 'jsonwebtoken';

const mockCertificate = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtestcertificate';
const mockPublicKey = `-----BEGIN CERTIFICATE-----\n${mockCertificate}\n-----END CERTIFICATE-----`;

// Helper to build a JWT-like token with a given payload
function encodeBase64Url(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildMockToken(payload: Record<string, unknown>, header: Record<string, unknown> = { alg: 'RS256', typ: 'JWT', kid: 'test-kid' }): string {
  const encodedHeader = encodeBase64Url(header);
  const body = encodeBase64Url(payload);
  const signature = 'mock-signature';
  return `${encodedHeader}.${body}.${signature}`;
}

function createMockRequest(headers: Record<string, string | undefined> = {}) {
  return {
    headers: {
      get: jest.fn((name: string) => {
        return headers[name.toLowerCase()] ?? null;
      }),
    },
  } as unknown as import('@azure/functions').HttpRequest;
}

function withAuthorization(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
  };
}

function withCustomAuthorization(token: string): Record<string, string> {
  return {
    'x-fabric-storyboard-authorization': token,
  };
}

function withConflictingHeaders(customToken: string, platformToken: string): Record<string, string> {
  return {
    ...withCustomAuthorization(customToken),
    authorization: `Bearer ${platformToken}`,
  };
}

function createLegacyMockRequest(authHeader?: string) {
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
  (jwt.verify as jest.Mock).mockReturnValue(payload);
}

function mockJwtDecodeOnly(payload: Record<string, unknown>) {
  // verify also returns the payload (claim validation is done manually)
  (jwt.verify as jest.Mock).mockReturnValue(payload);
}

function mockJwtVerifyFailure(message: string) {
  (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error(message); });
}

describe('Auth Middleware — validateToken', () => {
  beforeEach(() => {
    process.env.ENTRA_CLIENT_ID = 'test-client-id';
    process.env.ENTRA_TENANT_ID = 'test-tenant-id';
    jest.clearAllMocks();
    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        keys: [{ kid: 'test-kid', x5c: [mockCertificate] }],
      },
    });
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
    const request = createMockRequest(withAuthorization(token));

    const result = await validateToken(request);

    expect(result.token).toBe(token);
    expect(result.userId).toBe('user-object-id');
    expect(jwt.verify).toHaveBeenCalledWith(token, mockPublicKey, { algorithms: ['RS256'] });
  });

  it('throws when authorization header is missing', async () => {
    const request = createMockRequest();

    await expect(validateToken(request)).rejects.toThrow(/Missing or invalid access token header/);
  });

  it('throws when authorization header is not Bearer', async () => {
    const request = createLegacyMockRequest('Basic abc123');

    await expect(validateToken(request)).rejects.toThrow(/Missing or invalid access token header/);
  });

  it('accepts the custom auth header used by the taskpane', async () => {
    const payload = {
      aud: 'test-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600,
      oid: 'user-object-id',
    };
    mockJwtSuccess(payload);
    const token = buildMockToken(payload);
    const request = createMockRequest(withCustomAuthorization(token));

    const result = await validateToken(request);

    expect(result.token).toBe(token);
  });

  it('prefers the custom auth header over SWA-overwritten authorization header', async () => {
    const payload = {
      aud: 'test-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600,
      oid: 'user-object-id',
    };
    mockJwtSuccess(payload);
    const validToken = buildMockToken(payload);
    const request = createMockRequest(withConflictingHeaders(validToken, 'internal-platform-token'));

    const result = await validateToken(request);

    expect(result.token).toBe(validToken);
  });

  it('throws for a malformed token (not 3 parts)', async () => {
    const request = createMockRequest(withAuthorization('not-a-valid-jwt'));

    await expect(validateToken(request)).rejects.toThrow(/Malformed token/);
  });

  it('throws for a malformed token header', async () => {
    const payload = {
      aud: 'test-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = `not-json.${encodeBase64Url(payload)}.mock-signature`;
    const request = createMockRequest(withAuthorization(token));

    await expect(validateToken(request)).rejects.toThrow(/Malformed token header/);
  });

  it('throws when JWT signature verification fails', async () => {
    mockJwtVerifyFailure('invalid signature');
    const token = buildMockToken({ aud: 'test-client-id' });
    const request = createMockRequest(withAuthorization(token));

    await expect(validateToken(request)).rejects.toThrow(/Token verification failed: invalid signature/);
  });

  it('throws when token algorithm is not RS256', async () => {
    const payload = {
      aud: 'test-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = buildMockToken(payload, { alg: 'HS256', typ: 'JWT', kid: 'test-kid' });
    const request = createMockRequest(withAuthorization(token));

    await expect(validateToken(request)).rejects.toThrow(/Unsupported token signing algorithm: HS256/);
  });

  it('throws when token audience does not match client ID', async () => {
    const payload = {
      aud: 'wrong-client-id',
      iss: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    mockJwtDecodeOnly(payload);
    const token = buildMockToken(payload);
    const request = createMockRequest(withAuthorization(token));

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
    const request = createMockRequest(withAuthorization(token));

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
    const request = createMockRequest(withAuthorization(token));

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
    const request = createMockRequest(withAuthorization(token));

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
    const request = createMockRequest(withAuthorization(token));

    const result = await validateToken(request);
    expect(result.userId).toBe('user-subject-only');
  });

  it('falls back to trying all signing keys when kid is missing', async () => {
    process.env.ENTRA_TENANT_ID = 'fallback-tenant-id';
    const payload = {
      aud: 'test-client-id',
      iss: 'https://login.microsoftonline.com/fallback-tenant-id/v2.0',
      tid: 'fallback-tenant-id',
      exp: Math.floor(Date.now() / 1000) + 3600,
      sub: 'user-subject-only',
    };
    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        keys: [
          { kid: 'first-kid', x5c: ['firstcertificate'] },
          { kid: 'second-kid', x5c: [mockCertificate] },
        ],
      },
    });
    (jwt.verify as jest.Mock).mockImplementation((_token: string, signingKey: string) => {
      if (signingKey !== mockPublicKey) {
        throw new Error('invalid signature');
      }
      return payload;
    });

    const token = buildMockToken(payload, { alg: 'RS256', typ: 'JWT' });
    const request = createMockRequest(withAuthorization(token));

    const result = await validateToken(request);

    expect(result.userId).toBe('user-subject-only');
    expect(jwt.verify).toHaveBeenCalledTimes(2);
  });
});
