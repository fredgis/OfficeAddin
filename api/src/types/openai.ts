/** Types for DAX query execution and Azure OpenAI integration. */

export interface DaxQueryRequest {
  datasetId: string;
  query: string;
}

export interface DaxQueryResponse {
  results: DaxQueryResult[];
}

export interface DaxQueryResult {
  tables: DaxTable[];
}

export interface DaxTable {
  rows: Record<string, unknown>[];
}
