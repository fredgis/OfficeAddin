/** Typed shapes for the AI-powered executive insights feature. */

export interface InsightRequest {
  reportId: string;
  pageName: string;
  reportName?: string;
  dataContext?: string;
  customPrompt?: string;
}

export interface InsightItem {
  headline: string;
  detail: string;
  category?: string;
}

export interface InsightResponse {
  insights: InsightItem[];
  generatedAt: string;
  model: string;
}

/** Internal context passed to the OpenAI service for prompt construction. */
export interface InsightContext {
  reportId: string;
  pageName: string;
  reportName?: string;
  dataContext?: string;
  customPrompt?: string;
  openAIToken: string;
}
