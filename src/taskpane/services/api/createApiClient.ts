import axios, { AxiosInstance } from 'axios';

/** Creates a pre-configured axios client with auth header and shared error interceptor. */
export function createApiClient(token: string): AxiosInstance {
  const client = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      if (status === 401) {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      } else if (status === 403) {
        error.message = 'You do not have permission to access this resource.';
      } else if (status === 429) {
        error.message = 'Too many requests. Please wait a moment and try again.';
      }
      return Promise.reject(error);
    }
  );

  return client;
}
