export interface InsightItem {
  headline: string;
  detail: string;
  category?: string;
}

export interface InsightRequest {
  reportId: string;
  pageName: string;
  reportName?: string;
  dataContext?: string;
  customPrompt?: string;
  imageBase64?: string;
}

export interface InsightResponse {
  insights: InsightItem[];
  generatedAt: string;
  model: string;
}

export interface DaxQueryRequest {
  datasetId: string;
  query: string;
}

export interface DaxQueryResponse {
  results: Array<{
    tables: Array<{
      rows: Record<string, unknown>[];
    }>;
  }>;
}
