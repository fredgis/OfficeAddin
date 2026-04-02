import { AxiosInstance } from 'axios';
import { createApiClient } from './createApiClient';

export interface Workspace {
  id: string;
  name: string;
  type?: string;
  state?: string;
}

export interface Report {
  id: string;
  name: string;
  webUrl?: string;
  embedUrl?: string;
  datasetId?: string;
}

export interface ReportPage {
  name: string;
  displayName: string;
  order: number;
}

export interface ExportResult {
  image: string; // base64
  mimeType: string;
  reportId: string;
  pageName: string;
}

export interface InsightItem {
  headline: string;
  body: string;
}

export interface InsightResult {
  insights: InsightItem[];
  summary: string;
  tokensUsed?: number;
}

export class PowerBIClient {
  private client: AxiosInstance;

  constructor(token: string) {
    this.client = createApiClient(token);
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const { data } = await this.client.get('/workspaces');
    return data;
  }

  async getReports(workspaceId: string): Promise<Report[]> {
    const { data } = await this.client.get(`/workspaces/${workspaceId}/reports`);
    return data;
  }

  async getPages(reportId: string): Promise<ReportPage[]> {
    const { data } = await this.client.get(`/reports/${reportId}/pages`);
    return data;
  }

  async exportPage(reportId: string, pageName: string, format: 'PNG' | 'JPEG' = 'PNG'): Promise<ExportResult> {
    const { data } = await this.client.post('/export', { reportId, pageName, format });
    return data;
  }

  async generateInsights(params: {
    reportId: string;
    pageName: string;
    reportName?: string;
    workspaceName?: string;
    datasetId?: string;
    customPrompt?: string;
  }): Promise<InsightResult> {
    const { data } = await this.client.post('/insights', params);
    return data;
  }
}
