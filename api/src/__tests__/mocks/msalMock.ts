/**
 * Shared MSAL mock helpers for backend tests.
 */

const mockAcquireTokenOnBehalfOf = jest.fn();

jest.mock('@azure/msal-node', () => ({
  ConfidentialClientApplication: jest.fn().mockImplementation(() => ({
    acquireTokenOnBehalfOf: mockAcquireTokenOnBehalfOf,
  })),
}));

export function resetMsalMocks(): void {
  mockAcquireTokenOnBehalfOf.mockReset();
}

/** Simulate a successful OBO token exchange. */
export function mockOboSuccess(accessToken = 'mock-obo-token'): void {
  mockAcquireTokenOnBehalfOf.mockResolvedValue({ accessToken });
}

/** Simulate a failed OBO token exchange. */
export function mockOboFailure(message = 'OBO exchange failed'): void {
  mockAcquireTokenOnBehalfOf.mockRejectedValue(new Error(message));
}

/** Simulate an OBO exchange returning no token. */
export function mockOboEmpty(): void {
  mockAcquireTokenOnBehalfOf.mockResolvedValue(null);
}

export { mockAcquireTokenOnBehalfOf };
