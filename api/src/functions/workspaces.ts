import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { validateToken } from '../middleware/authMiddleware.js';
import { exchangeForPowerBIToken } from '../services/authService.js';
import { handleError } from '../middleware/errorHandler.js';
import { getWorkspaces } from '../services/powerbiService.js';

export async function workspaces(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const auth = await validateToken(request);
    const pbiToken = await exchangeForPowerBIToken(auth.token);
    const result = await getWorkspaces(pbiToken);

    return {
      status: 200,
      jsonBody: result.map((w) => ({
        id: w.id,
        name: w.name,
        type: w.type,
        state: w.state,
      })),
    };
  } catch (error) {
    context.error('workspaces endpoint failed', error);
    return handleError(error);
  }
}

app.http('workspaces', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'workspaces',
  handler: workspaces,
});
