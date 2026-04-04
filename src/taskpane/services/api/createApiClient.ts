import axios, { AxiosInstance } from 'axios';

const CUSTOM_AUTH_HEADER = 'X-Fabric-Storyboard-Authorization';

/** Creates a pre-configured axios client with auth header and shared error interceptor. */
export function createApiClient(token: string): AxiosInstance {
  const client = axios.create({
    baseURL: '/api',
    headers: {
      Authorization: `Bearer ${token}`,
      [CUSTOM_AUTH_HEADER]: token,
    },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const backendError =
        typeof error.response?.data?.error === 'string' ? error.response.data.error : null;
      if (status === 401) {
        const authError = backendError || 'Session expired. Click Sign in to continue.';
        window.dispatchEvent(new CustomEvent('auth:expired', { detail: authError }));
      } else if (status === 403) {
        error.message = backendError || 'You do not have permission to access this resource.';
      } else if (status === 429) {
        error.message = backendError || 'Too many requests. Please wait a moment and try again.';
      } else if (backendError) {
        error.message = backendError;
      }
      return Promise.reject(error);
    }
  );

  return client;
}
