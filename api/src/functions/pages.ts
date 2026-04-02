import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { validateToken } from '../middleware/authMiddleware.js';
import { exchangeForPowerBIToken } from '../services/authService.js';
import { createErrorResponse, handleError } from '../middleware/errorHandler.js';
import { getPages } from '../services/powerbiService.js';

export async function pages(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const reportId = request.params.reportId;
    if (!reportId) {
      return createErrorResponse('reportId parameter is required', 400);
    }

    const auth = await validateToken(request);
    const pbiToken = await exchangeForPowerBIToken(auth.token);
    const result = await getPages(pbiToken, reportId);

    return {
      status: 200,
      jsonBody: result.map((p) => ({
        name: p.name,
        displayName: p.displayName,
        order: p.order,
      })),
    };
  } catch (error) {
    context.error('pages endpoint failed', error);
    return handleError(error);
  }
}

app.http('pages', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'reports/{reportId}/pages',
  handler: pages,
});
