import { AxiosInstance } from 'axios';
import { createApiClient } from './createApiClient';
import type { InsightRequest, InsightResponse, DaxQueryRequest, DaxQueryResponse } from '../../types/insights';

export class InsightsClient {
  private client: AxiosInstance;

  constructor(token: string) {
    this.client = createApiClient(token);
  }

  async generateInsights(request: InsightRequest): Promise<InsightResponse> {
    const { data } = await this.client.post('/insights', request);
    return data;
  }

  async executeDaxQuery(request: DaxQueryRequest): Promise<DaxQueryResponse> {
    const { data } = await this.client.post('/query', request);
    return data;
  }
}
