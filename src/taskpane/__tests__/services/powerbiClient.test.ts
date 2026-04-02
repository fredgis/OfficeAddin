import axios from 'axios';
import { PowerBIClient } from '../../services/api/powerbiClient';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PowerBIClient', () => {
  let interceptorRejected: ((error: unknown) => unknown) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    // Capture the response interceptor's error handler
    const mockInstance = {
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn((fulfilled: unknown, rejected: unknown) => {
            interceptorRejected = rejected as (error: unknown) => unknown;
          }),
        },
        request: { use: jest.fn() },
      },
      defaults: { headers: { common: {} } },
    };
    mockedAxios.create.mockReturnValue(mockInstance as unknown as ReturnType<typeof axios.create>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function getAxiosInstance() {
    return mockedAxios.create.mock.results[0]?.value;
  }

  // ── Constructor ─────────────────────────────────────────────────────────
  describe('constructor', () => {
    it('creates an axios instance with /api baseURL and auth header', () => {
      new PowerBIClient('my-token');

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: '/api',
          headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
        }),
      );
    });

    it('registers a response interceptor', () => {
      new PowerBIClient('my-token');
      const instance = getAxiosInstance();
      expect(instance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  // ── getWorkspaces ───────────────────────────────────────────────────────
  describe('getWorkspaces', () => {
    it('calls GET /workspaces and returns data', async () => {
      const workspaces = [{ id: 'ws-1', name: 'Sales' }];
      const client = new PowerBIClient('token');
      const instance = getAxiosInstance();
      instance.get.mockResolvedValue({ data: workspaces });

      const result = await client.getWorkspaces();

      expect(instance.get).toHaveBeenCalledWith('/workspaces');
      expect(result).toEqual(workspaces);
    });
  });

  // ── getReports ──────────────────────────────────────────────────────────
  describe('getReports', () => {
    it('calls GET /workspaces/:id/reports and returns data', async () => {
      const reports = [{ id: 'r-1', name: 'Revenue Report' }];
      const client = new PowerBIClient('token');
      const instance = getAxiosInstance();
      instance.get.mockResolvedValue({ data: reports });

      const result = await client.getReports('ws-1');

      expect(instance.get).toHaveBeenCalledWith('/workspaces/ws-1/reports');
      expect(result).toEqual(reports);
    });
  });

  // ── getPages ────────────────────────────────────────────────────────────
  describe('getPages', () => {
    it('calls GET /reports/:id/pages and returns data', async () => {
      const pages = [{ name: 'Page1', displayName: 'Overview', order: 0 }];
      const client = new PowerBIClient('token');
      const instance = getAxiosInstance();
      instance.get.mockResolvedValue({ data: pages });

      const result = await client.getPages('r-1');

      expect(instance.get).toHaveBeenCalledWith('/reports/r-1/pages');
      expect(result).toEqual(pages);
    });
  });

  // ── exportPage ──────────────────────────────────────────────────────────
  describe('exportPage', () => {
    it('calls POST /export with correct payload', async () => {
      const exportResult = { image: 'base64data', mimeType: 'image/png', reportId: 'r-1', pageName: 'Page1' };
      const client = new PowerBIClient('token');
      const instance = getAxiosInstance();
      instance.post.mockResolvedValue({ data: exportResult });

      const result = await client.exportPage('r-1', 'Page1', 'PNG');

      expect(instance.post).toHaveBeenCalledWith('/export', { reportId: 'r-1', pageName: 'Page1', format: 'PNG' });
      expect(result).toEqual(exportResult);
    });

    it('defaults format to PNG', async () => {
      const client = new PowerBIClient('token');
      const instance = getAxiosInstance();
      instance.post.mockResolvedValue({ data: {} });

      await client.exportPage('r-1', 'Page1');

      expect(instance.post).toHaveBeenCalledWith('/export', { reportId: 'r-1', pageName: 'Page1', format: 'PNG' });
    });
  });

  // ── Error interceptor ──────────────────────────────────────────────────
  describe('response error interceptor', () => {
    it('dispatches auth:expired event on 401', async () => {
      new PowerBIClient('token');
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

      const error = { response: { status: 401 }, message: 'Unauthorized' };
      try {
        await interceptorRejected!(error);
      } catch {
        // interceptor rejects – expected
      }

      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe('auth:expired');

      dispatchSpy.mockRestore();
    });

    it('sets friendly message on 403', async () => {
      new PowerBIClient('token');
      const error = { response: { status: 403 }, message: 'Forbidden' };

      try {
        await interceptorRejected!(error);
      } catch (e: unknown) {
        expect((e as { message: string }).message).toContain('do not have permission');
      }
    });

    it('sets friendly message on 429', async () => {
      new PowerBIClient('token');
      const error = { response: { status: 429 }, message: 'Too Many Requests' };

      try {
        await interceptorRejected!(error);
      } catch (e: unknown) {
        expect((e as { message: string }).message).toContain('Too many requests');
      }
    });
  });
});
