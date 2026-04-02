/**
 * Shared axios mock helpers for backend tests.
 */

import axios from 'axios';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

/** Reset all axios mocks between tests. */
export function resetAxiosMocks(): void {
  mockedAxios.get.mockReset();
  mockedAxios.post.mockReset();
}

/** Helper to create a successful axios response. */
export function axiosResponse<T>(data: T, status = 200) {
  return { data, status, statusText: 'OK', headers: {}, config: {} as never };
}

/** Helper to create an axios error with response. */
export function axiosError(status: number, data?: unknown) {
  const error = new Error(`Request failed with status code ${status}`) as Error & {
    response: { status: number; data: unknown };
    isAxiosError: boolean;
  };
  error.response = { status, data: data ?? {} };
  error.isAxiosError = true;
  // Make it an AxiosError instance by setting the name
  error.name = 'AxiosError';
  Object.setPrototypeOf(error, axios.AxiosError?.prototype ?? Error.prototype);
  return error;
}

export { mockedAxios };
