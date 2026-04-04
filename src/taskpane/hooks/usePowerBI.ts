import { useQuery, useMutation } from '@tanstack/react-query';
import { PowerBIClient } from '../services/api/powerbiClient';
import { useAuth } from '../services/auth';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const retryDelay = (attempt: number) => Math.min(1000 * 2 ** attempt, 30000);

export function useWorkspaces() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const token = await getToken();
      const client = new PowerBIClient(token);
      return client.getWorkspaces();
    },
    staleTime: STALE_TIME,
    retry: 2,
    retryDelay,
    refetchOnWindowFocus: false,
  });
}

export function useReports(workspaceId: string | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ['reports', workspaceId],
    queryFn: async () => {
      const token = await getToken();
      const client = new PowerBIClient(token);
      return client.getReports(workspaceId!);
    },
    enabled: !!workspaceId,
    staleTime: STALE_TIME,
    retry: 2,
    retryDelay,
    refetchOnWindowFocus: false,
  });
}

export function usePages(reportId: string | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ['pages', reportId],
    queryFn: async () => {
      const token = await getToken();
      const client = new PowerBIClient(token);
      return client.getPages(reportId!);
    },
    enabled: !!reportId,
    staleTime: STALE_TIME,
    retry: 2,
    retryDelay,
    refetchOnWindowFocus: false,
  });
}

export function useExportPage() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({ reportId, pageName, format, workspaceId }: { reportId: string; pageName: string; format?: 'PNG'; workspaceId?: string }) => {
      const token = await getToken();
      const client = new PowerBIClient(token);
      return client.exportPage(reportId, pageName, format || 'PNG', workspaceId);
    },
  });
}

export function useGenerateInsights() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (params: {
      reportId: string;
      pageName: string;
      reportName?: string;
      workspaceName?: string;
      datasetId?: string;
      customPrompt?: string;
    }) => {
      const token = await getToken();
      const client = new PowerBIClient(token);
      return client.generateInsights(params);
    },
  });
}
