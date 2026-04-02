import { useMutation } from '@tanstack/react-query';
import { InsightsClient } from '../services/api/insightsClient';
import { useAuth } from '../services/auth';
import type { InsightRequest } from '../types/insights';

export function useGenerateInsights() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (request: InsightRequest) => {
      const token = await getToken();
      const client = new InsightsClient(token);
      return client.generateInsights(request);
    },
  });
}
