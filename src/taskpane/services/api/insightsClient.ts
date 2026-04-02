import axios, { AxiosInstance } from 'axios';
import type { InsightRequest, InsightResponse } from '../../types/insights';

export class InsightsClient {
  private client: AxiosInstance;

  constructor(token: string) {
    this.client = axios.create({
      baseURL: '/api',
      headers: { Authorization: `Bearer ${token}` },
    });

    this.client.interceptors.response.use(
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
  }

  async generateInsights(request: InsightRequest): Promise<InsightResponse> {
    const { data } = await this.client.post('/insights', request);
    return data;
  }
}
