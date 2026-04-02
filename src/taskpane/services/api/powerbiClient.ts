import axios, { AxiosInstance } from 'axios';

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

export class PowerBIClient {
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
}
