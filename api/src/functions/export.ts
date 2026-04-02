import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { validateToken } from '../middleware/authMiddleware.js';
import { exchangeForPowerBIToken } from '../services/authService.js';
import { PowerBIService } from '../services/powerbiService.js';
import { handleError, createErrorResponse } from '../middleware/errorHandler.js';
import type { ExportRequest } from '../types/powerbi.js';

export async function exportPage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as Partial<ExportRequest>;

    if (!body.reportId || !body.pageName) {
      return createErrorResponse('reportId and pageName are required', 400);
    }

    const format = body.format || 'PNG';
    const auth = await validateToken(request);
    const pbiToken = await exchangeForPowerBIToken(auth.token);
    const service = new PowerBIService(pbiToken);

    context.log(`Starting export for report ${body.reportId}, page ${body.pageName}`);

    // Start export
    const exportId = await service.startExport(body.reportId, body.pageName, format, body.width, body.height);
    context.log(`Export started with ID: ${exportId}`);

    // Poll for completion
    const status = await service.pollExportToCompletion(body.reportId, exportId);
    context.log(`Export completed: ${status.status}`);

    // Download the file
    const fileBuffer = await service.getExportFile(body.reportId, exportId);
    const base64Image = fileBuffer.toString('base64');
    const mimeType = format === 'PNG' ? 'image/png' : 'image/jpeg';

    return {
      status: 200,
      jsonBody: {
        image: base64Image,
        mimeType,
        reportId: body.reportId,
        pageName: body.pageName,
      }
    };
  } catch (error) {
    context.error('Export failed:', error);
    return handleError(error);
  }
}

app.http('export', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'export',
  handler: exportPage
});
