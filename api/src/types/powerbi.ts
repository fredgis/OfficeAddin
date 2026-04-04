/** Typed shapes returned by the Power BI REST API. */

export interface Workspace {
  id: string;
  name: string;
  type: string;
  state: string;
}

export interface Report {
  id: string;
  name: string;
  webUrl: string;
  embedUrl: string;
  datasetId: string;
}

export interface Page {
  name: string;
  displayName: string;
  order: number;
}

/** Generic Power BI list response wrapper. */
export interface PowerBIListResponse<T> {
  value: T[];
}

/** Request body for the export endpoint. */
export interface ExportRequest {
  reportId: string;
  pageName: string;
  format: 'PNG' | 'PDF';
  width?: number;
  height?: number;
}

/** Status of an in-progress Power BI export operation. */
export interface ExportStatus {
  id: string;
  status: 'NotStarted' | 'Running' | 'Succeeded' | 'Failed';
  percentComplete: number;
  reportId: string;
  reportName?: string;
  resourceLocation?: string;
}

/** Response returned by the export endpoint. */
export interface ExportResponse {
  image: string;
  mimeType: string;
  reportId: string;
  pageName: string;
}
