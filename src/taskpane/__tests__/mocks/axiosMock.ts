/**
 * Shared fetch/axios mock helpers for frontend tests.
 */

import axios from 'axios';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

/** Create a mock AxiosInstance with interceptors support. */
export function createMockAxiosInstance() {
  const interceptorHandlers: { fulfilled?: (v: unknown) => unknown; rejected?: (e: unknown) => unknown }[] = [];

  const instance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      response: {
        use: jest.fn((fulfilled, rejected) => {
          interceptorHandlers.push({ fulfilled, rejected });
        }),
      },
      request: {
        use: jest.fn(),
      },
    },
    defaults: { headers: { common: {} } },
  };

  return { instance, interceptorHandlers };
}

/** Helper to simulate an axios error with a response status. */
export function createAxiosError(status: number, data?: unknown) {
  const error = new Error(`Request failed with status ${status}`) as Error & {
    response?: { status: number; data: unknown };
  };
  error.response = { status, data: data ?? {} };
  return error;
}

export { mockedAxios };
