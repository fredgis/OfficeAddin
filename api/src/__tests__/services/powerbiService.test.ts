import { mockedAxios, resetAxiosMocks, axiosResponse, axiosError } from '../mocks/axiosMock';
import { getWorkspaces, getReports, getPages, PowerBIService } from '../../services/powerbiService';

describe('PowerBI Service — standalone helpers', () => {
  beforeEach(() => {
    resetAxiosMocks();
  });

  // ── getWorkspaces ───────────────────────────────────────────────────────
  describe('getWorkspaces', () => {
    it('returns an array of workspaces', async () => {
      const workspaces = [
        { id: 'ws-1', name: 'Sales', type: 'Workspace', state: 'Active' },
        { id: 'ws-2', name: 'Finance', type: 'Workspace', state: 'Active' },
      ];
      mockedAxios.get.mockResolvedValue(axiosResponse({ value: workspaces }));

      const result = await getWorkspaces('token-123');

      expect(result).toEqual(workspaces);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/groups'),
        expect.objectContaining({ headers: { Authorization: 'Bearer token-123' } }),
      );
    });

    it('throws on 401 unauthorized', async () => {
      mockedAxios.get.mockRejectedValue(axiosError(401));
      await expect(getWorkspaces('bad-token')).rejects.toThrow(/unauthorized/i);
    });

    it('throws on 403 forbidden', async () => {
      mockedAxios.get.mockRejectedValue(axiosError(403));
      await expect(getWorkspaces('token')).rejects.toThrow(/forbidden/i);
    });

    it('throws on 429 rate limit', async () => {
      mockedAxios.get.mockRejectedValue(axiosError(429));
      await expect(getWorkspaces('token')).rejects.toThrow(/rate limit/i);
    });

    it('throws on 500 server error with details', async () => {
      mockedAxios.get.mockRejectedValue(axiosError(500, { error: 'Internal error' }));
      await expect(getWorkspaces('token')).rejects.toThrow(/Power BI error \(500\)/);
    });
  });

  // ── getReports ──────────────────────────────────────────────────────────
  describe('getReports', () => {
    it('returns an array of reports for a workspace', async () => {
      const reports = [
        { id: 'r-1', name: 'Revenue', webUrl: '', embedUrl: '', datasetId: 'ds-1' },
      ];
      mockedAxios.get.mockResolvedValue(axiosResponse({ value: reports }));

      const result = await getReports('token', 'ws-1');

      expect(result).toEqual(reports);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/groups/ws-1/reports'),
        expect.anything(),
      );
    });

    it('throws when workspaceId is empty', async () => {
      await expect(getReports('token', '')).rejects.toThrow('workspaceId is required');
    });
  });

  // ── getPages ────────────────────────────────────────────────────────────
  describe('getPages', () => {
    it('returns an array of pages for a report', async () => {
      const pages = [
        { name: 'ReportSection1', displayName: 'Overview', order: 0 },
      ];
      mockedAxios.get.mockResolvedValue(axiosResponse({ value: pages }));

      const result = await getPages('token', 'r-1');

      expect(result).toEqual(pages);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/reports/r-1/pages'),
        expect.anything(),
      );
    });

    it('throws when reportId is empty', async () => {
      await expect(getPages('token', '')).rejects.toThrow('reportId is required');
    });
  });
});

describe('PowerBIService class', () => {
  beforeEach(() => {
    resetAxiosMocks();
  });

  describe('startExport', () => {
    it('returns the export id on success', async () => {
      mockedAxios.post.mockResolvedValue(axiosResponse({ id: 'export-1' }));

      const service = new PowerBIService('token');
      const id = await service.startExport('r-1', 'Page1', 'PNG');

      expect(id).toBe('export-1');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/ExportTo'),
        expect.objectContaining({ format: 'PNG' }),
        expect.anything(),
      );
    });
  });

  describe('getExportStatus', () => {
    it('returns export status object', async () => {
      const status = { id: 'export-1', status: 'Succeeded', percentComplete: 100, reportId: 'r-1' };
      mockedAxios.get.mockResolvedValue(axiosResponse(status));

      const service = new PowerBIService('token');
      const result = await service.getExportStatus('r-1', 'export-1');

      expect(result.status).toBe('Succeeded');
    });
  });

  describe('pollExportToCompletion', () => {
    it('polls until status is Succeeded', async () => {
      const service = new PowerBIService('token');

      mockedAxios.get
        .mockResolvedValueOnce(axiosResponse({ id: 'e-1', status: 'Running', percentComplete: 50, reportId: 'r-1' }))
        .mockResolvedValueOnce(axiosResponse({ id: 'e-1', status: 'Succeeded', percentComplete: 100, reportId: 'r-1' }));

      const result = await service.pollExportToCompletion('r-1', 'e-1', 10000);
      expect(result.status).toBe('Succeeded');
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('throws when export status is Failed', async () => {
      const service = new PowerBIService('token');
      mockedAxios.get.mockResolvedValue(axiosResponse({ id: 'e-1', status: 'Failed', percentComplete: 0, reportId: 'r-1' }));

      await expect(service.pollExportToCompletion('r-1', 'e-1', 5000)).rejects.toThrow('Export failed');
    });
  });
});
