import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { validateToken } from '../middleware/authMiddleware.js';
import { exchangeForOpenAIToken } from '../services/authService.js';
import { generateInsights } from '../services/openaiService.js';
import { handleError, createErrorResponse } from '../middleware/errorHandler.js';
import { InsightRequest, InsightResponse } from '../types/insights.js';

export async function insightsHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as InsightRequest;

    if (!body.reportId || !body.pageName) {
      return createErrorResponse('reportId and pageName are required', 400);
    }

    const auth = await validateToken(request);
    const openAIToken = await exchangeForOpenAIToken(auth.token);

    context.log(`Generating insights for report ${body.reportId}, page ${body.pageName}`);

    const insights = await generateInsights({
      reportId: body.reportId,
      pageName: body.pageName,
      reportName: body.reportName,
      dataContext: body.dataContext,
      customPrompt: body.customPrompt,
      openAIToken,
    });

    const response: InsightResponse = {
      insights,
      generatedAt: new Date().toISOString(),
      model: process.env.AZURE_OPENAI_DEPLOYMENT || 'unknown',
    };

    return {
      status: 200,
      jsonBody: response,
    };
  } catch (error) {
    context.error('Insights generation failed:', error);
    return handleError(error);
  }
}

app.http('insights', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'insights',
  handler: insightsHandler,
});
