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
