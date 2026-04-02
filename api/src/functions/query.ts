import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { validateToken } from '../middleware/authMiddleware.js';
import { exchangeForPowerBIToken } from '../services/authService.js';
import { handleError, createErrorResponse } from '../middleware/errorHandler.js';
import axios from 'axios';
import type { DaxQueryRequest, DaxQueryResponse } from '../types/openai.js';

const POWER_BI_BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

export async function queryHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as DaxQueryRequest;

    if (!body.datasetId || !body.query) {
      return createErrorResponse('datasetId and query are required', 400);
    }

    const auth = await validateToken(request);
    const pbiToken = await exchangeForPowerBIToken(auth.token);

    context.log(`Executing DAX query on dataset ${body.datasetId}`);

    const response = await axios.post<DaxQueryResponse>(
      `${POWER_BI_BASE_URL}/datasets/${encodeURIComponent(body.datasetId)}/executeQueries`,
      {
        queries: [{ query: body.query }],
        serializerSettings: { includeNulls: true },
      },
      {
        headers: {
          Authorization: `Bearer ${pbiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 60_000,
      },
    );

    return {
      status: 200,
      jsonBody: response.data,
    };
  } catch (error) {
    context.error('DAX query execution failed:', error);
    return handleError(error);
  }
}

app.http('query', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'query',
  handler: queryHandler,
});
