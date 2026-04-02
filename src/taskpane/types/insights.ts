export interface InsightItem {
  headline: string;
  detail: string;
}

export interface InsightRequest {
  reportId: string;
  pageName: string;
  imageBase64?: string;
}

export interface InsightResponse {
  insights: InsightItem[];
  reportId: string;
  pageName: string;
}
