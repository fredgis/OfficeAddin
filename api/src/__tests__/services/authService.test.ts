import {
  mockAcquireTokenOnBehalfOf,
  resetMsalMocks,
  mockOboSuccess,
  mockOboFailure,
  mockOboEmpty,
} from '../mocks/msalMock';

// Import after mock is set up
import { exchangeForPowerBIToken, exchangeForOpenAIToken, POWER_BI_SCOPE, OPENAI_SCOPE } from '../../services/authService';

describe('Auth Service', () => {
  beforeEach(() => {
    resetMsalMocks();
    // Set required env vars
    process.env.ENTRA_CLIENT_ID = 'test-client-id';
    process.env.ENTRA_CLIENT_SECRET = 'test-secret';
    process.env.ENTRA_TENANT_ID = 'test-tenant-id';
  });

  afterEach(() => {
    delete process.env.ENTRA_CLIENT_ID;
    delete process.env.ENTRA_CLIENT_SECRET;
    delete process.env.ENTRA_TENANT_ID;
  });

  describe('exchangeForPowerBIToken', () => {
    it('returns an access token on successful OBO exchange', async () => {
      mockOboSuccess('pbi-token-123');

      const token = await exchangeForPowerBIToken('user-token');

      expect(token).toBe('pbi-token-123');
      expect(mockAcquireTokenOnBehalfOf).toHaveBeenCalledWith(
        expect.objectContaining({
          oboAssertion: 'user-token',
          scopes: [POWER_BI_SCOPE],
        }),
      );
    });

    it('throws when OBO exchange fails', async () => {
      mockOboFailure('Service unavailable');

      await expect(exchangeForPowerBIToken('user-token')).rejects.toThrow('Service unavailable');
    });

    it('throws when OBO returns null response', async () => {
      mockOboEmpty();

      await expect(exchangeForPowerBIToken('user-token')).rejects.toThrow(/OBO token exchange failed/);
    });
  });

  describe('exchangeForOpenAIToken', () => {
    it('returns an access token for OpenAI scope', async () => {
      mockOboSuccess('openai-token-456');

      const token = await exchangeForOpenAIToken('user-token');

      expect(token).toBe('openai-token-456');
      expect(mockAcquireTokenOnBehalfOf).toHaveBeenCalledWith(
        expect.objectContaining({
          scopes: [OPENAI_SCOPE],
        }),
      );
    });

    it('throws when OBO exchange returns no accessToken', async () => {
      mockAcquireTokenOnBehalfOf.mockResolvedValue({ accessToken: '' });

      await expect(exchangeForOpenAIToken('user-token')).rejects.toThrow(/OBO token exchange failed/);
    });
  });

  describe('scopes', () => {
    it('POWER_BI_SCOPE is the Power BI default scope', () => {
      expect(POWER_BI_SCOPE).toBe('https://analysis.windows.net/powerbi/api/.default');
    });

    it('OPENAI_SCOPE is the Cognitive Services default scope', () => {
      expect(OPENAI_SCOPE).toBe('https://cognitiveservices.azure.com/.default');
    });
  });
});
