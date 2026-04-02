import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { validateToken } from '../middleware/authMiddleware.js';
import { exchangeForPowerBIToken } from '../services/authService.js';
import { createErrorResponse, handleError } from '../middleware/errorHandler.js';
import { getReports } from '../services/powerbiService.js';

export async function reports(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const workspaceId = request.params.workspaceId;
    if (!workspaceId) {
      return createErrorResponse('workspaceId parameter is required', 400);
    }

    const auth = await validateToken(request);
    const pbiToken = await exchangeForPowerBIToken(auth.token);
    const result = await getReports(pbiToken, workspaceId);

    return {
      status: 200,
      jsonBody: result.map((r) => ({
        id: r.id,
        name: r.name,
        webUrl: r.webUrl,
        embedUrl: r.embedUrl,
        datasetId: r.datasetId,
      })),
    };
  } catch (error) {
    context.error('reports endpoint failed', error);
    return handleError(error);
  }
}

app.http('reports', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'workspaces/{workspaceId}/reports',
  handler: reports,
});
