import axios, { AxiosError } from 'axios';
import { Workspace, Report, Page, PowerBIListResponse, ExportRequest, ExportStatus, ExportResponse } from '../types/powerbi.js';

const POWER_BI_BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

class HttpStatusError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'HttpStatusError';
  }
}

// Re-export types so existing consumers still work
export type { Workspace, Report, Page, ExportRequest, ExportStatus, ExportResponse } from '../types/powerbi.js';
/** @deprecated Use Page instead */
export type ReportPage = Page;

function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

function handlePbiError(err: unknown): never {
  if (err instanceof AxiosError && err.response) {
    const status = err.response.status;
    const detail =
      typeof err.response.data === 'object' && err.response.data
        ? JSON.stringify((err.response.data as Record<string, unknown>).error ?? err.response.data)
        : err.message;

    if (status === 401) throw new HttpStatusError(`Power BI: unauthorized – ${detail}`, 401);
    if (status === 403) throw new HttpStatusError(`Power BI: forbidden – ${detail}`, 403);
    if (status === 404) throw new HttpStatusError(`Power BI: resource not found – ${detail}`, 404);
    if (status === 429) throw new HttpStatusError('Power BI: rate limit exceeded – try again later', 429);
    throw new HttpStatusError(`Power BI error (${status}): ${detail}`, status);
  }
  throw err;
}

// ── Standalone helpers (preferred for new code) ─────────────────────────────

/** List workspaces the user has access to. */
export async function getWorkspaces(accessToken: string): Promise<Workspace[]> {
  try {
    const res = await axios.get<PowerBIListResponse<Workspace>>(
      `${POWER_BI_BASE_URL}/groups`,
      { headers: authHeader(accessToken) },
    );
    return res.data.value;
  } catch (err) {
    handlePbiError(err);
  }
}

/** List reports in a workspace. */
export async function getReports(accessToken: string, workspaceId: string): Promise<Report[]> {
  if (!workspaceId) throw new Error('workspaceId is required');
  try {
    const res = await axios.get<PowerBIListResponse<Report>>(
      `${POWER_BI_BASE_URL}/groups/${encodeURIComponent(workspaceId)}/reports`,
      { headers: authHeader(accessToken) },
    );
    return res.data.value;
  } catch (err) {
    handlePbiError(err);
  }
}

/** List pages in a report. */
export async function getPages(accessToken: string, reportId: string): Promise<Page[]> {
  if (!reportId) throw new Error('reportId is required');
  try {
    const res = await axios.get<PowerBIListResponse<Page>>(
      `${POWER_BI_BASE_URL}/reports/${encodeURIComponent(reportId)}/pages`,
      { headers: authHeader(accessToken) },
    );
    return res.data.value;
  } catch (err) {
    handlePbiError(err);
  }
}

// ── Class-based API (kept for backward compatibility with export features) ──

export class PowerBIService {
  constructor(private accessToken: string) {}

  private get headers() {
    return authHeader(this.accessToken);
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return getWorkspaces(this.accessToken);
  }

  async getReports(workspaceId: string): Promise<Report[]> {
    return getReports(this.accessToken, workspaceId);
  }

  async getPages(reportId: string): Promise<Page[]> {
    return getPages(this.accessToken, reportId);
  }

  async startExport(reportId: string, pageName: string, format: 'PNG' | 'PDF' = 'PNG', width?: number, height?: number, workspaceId?: string): Promise<string> {
    try {
      const pageConfig: Record<string, unknown> = { pageName };
      if (width || height) {
        pageConfig.exportOptions = {
          ...(width ? { width } : {}),
          ...(height ? { height } : {}),
        };
      }

      const basePath = workspaceId
        ? `${POWER_BI_BASE_URL}/groups/${encodeURIComponent(workspaceId)}/reports/${encodeURIComponent(reportId)}/ExportTo`
        : `${POWER_BI_BASE_URL}/reports/${encodeURIComponent(reportId)}/ExportTo`;

      const response = await axios.post(
        basePath,
        {
          format,
          powerBIReportConfiguration: {
            pages: [pageConfig],
          },
        },
        { headers: this.headers },
      );
      return response.data.id;
    } catch (err) {
      handlePbiError(err);
    }
  }

  async getExportStatus(reportId: string, exportId: string, workspaceId?: string): Promise<ExportStatus> {
    try {
      const basePath = workspaceId
        ? `${POWER_BI_BASE_URL}/groups/${encodeURIComponent(workspaceId)}/reports/${encodeURIComponent(reportId)}/exports/${encodeURIComponent(exportId)}`
        : `${POWER_BI_BASE_URL}/reports/${encodeURIComponent(reportId)}/exports/${encodeURIComponent(exportId)}`;
      const response = await axios.get(basePath, { headers: this.headers });
      return response.data;
    } catch (err) {
      handlePbiError(err);
    }
  }

  async getExportFile(reportId: string, exportId: string, workspaceId?: string): Promise<Buffer> {
    try {
      const basePath = workspaceId
        ? `${POWER_BI_BASE_URL}/groups/${encodeURIComponent(workspaceId)}/reports/${encodeURIComponent(reportId)}/exports/${encodeURIComponent(exportId)}/file`
        : `${POWER_BI_BASE_URL}/reports/${encodeURIComponent(reportId)}/exports/${encodeURIComponent(exportId)}/file`;
      const response = await axios.get(basePath, { headers: this.headers, responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } catch (err) {
      handlePbiError(err);
    }
  }

  async pollExportToCompletion(reportId: string, exportId: string, timeoutMs: number = 300000, workspaceId?: string): Promise<ExportStatus> {
    const startTime = Date.now();
    let delay = 2000;

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getExportStatus(reportId, exportId, workspaceId);

      if (status.status === 'Succeeded') return status;
      if (status.status === 'Failed') throw new Error('Export failed');

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, 30000);
    }

    throw new Error('Export timed out after 5 minutes');
  }
}
