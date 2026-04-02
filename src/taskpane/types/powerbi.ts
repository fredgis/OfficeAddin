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
