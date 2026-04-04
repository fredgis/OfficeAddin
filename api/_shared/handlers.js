const axios = require('axios');

function getErrorHelpers() {
  return require('../dist/middleware/errorHandler.js');
}

function getAuthMiddleware() {
  return require('../dist/middleware/authMiddleware.js');
}

function getAuthService() {
  return require('../dist/services/authService.js');
}

function getPowerBIService() {
  return require('../dist/services/powerbiService.js');
}

function getOpenAIService() {
  return require('../dist/services/openaiService.js');
}

async function health(_request, context) {
  context.log('Health check endpoint called');
  return {
    status: 200,
    jsonBody: { status: 'ok', timestamp: new Date().toISOString() },
  };
}

async function workspaces(request, context) {
  try {
    const { validateToken } = getAuthMiddleware();
    const { exchangeForPowerBIToken } = getAuthService();
    const { getWorkspaces } = getPowerBIService();
    const auth = await validateToken(request);
    const pbiToken = await exchangeForPowerBIToken(auth.token);
    const result = await getWorkspaces(pbiToken);

    return {
      status: 200,
      jsonBody: result.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        type: workspace.type,
        state: workspace.state,
      })),
    };
  } catch (error) {
    const { handleError } = getErrorHelpers();
    context.log('workspaces endpoint failed', error);
    return handleError(error);
  }
}

async function reports(request, context) {
  try {
    const { createErrorResponse, handleError } = getErrorHelpers();
    const workspaceId = request.params.workspaceId;
    if (!workspaceId) {
      return createErrorResponse('workspaceId parameter is required', 400);
    }

    const { validateToken } = getAuthMiddleware();
    const { exchangeForPowerBIToken } = getAuthService();
    const { getReports } = getPowerBIService();
    const auth = await validateToken(request);
    const pbiToken = await exchangeForPowerBIToken(auth.token);
    const result = await getReports(pbiToken, workspaceId);

    return {
      status: 200,
      jsonBody: result.map((report) => ({
        id: report.id,
        name: report.name,
        webUrl: report.webUrl,
        embedUrl: report.embedUrl,
        datasetId: report.datasetId,
      })),
    };
  } catch (error) {
    const { handleError } = getErrorHelpers();
    context.log('reports endpoint failed', error);
    return handleError(error);
  }
}

async function pages(request, context) {
  try {
    const { createErrorResponse, handleError } = getErrorHelpers();
    const reportId = request.params.reportId;
    if (!reportId) {
      return createErrorResponse('reportId parameter is required', 400);
    }

    const { validateToken } = getAuthMiddleware();
    const { exchangeForPowerBIToken } = getAuthService();
    const { getPages } = getPowerBIService();
    const auth = await validateToken(request);
    const pbiToken = await exchangeForPowerBIToken(auth.token);
    const result = await getPages(pbiToken, reportId);

    return {
      status: 200,
      jsonBody: result.map((page) => ({
        name: page.name,
        displayName: page.displayName,
        order: page.order,
      })),
    };
  } catch (error) {
    const { handleError } = getErrorHelpers();
    context.log('pages endpoint failed', error);
    return handleError(error);
  }
}

async function exportPage(request, context) {
  try {
    const { createErrorResponse, handleError } = getErrorHelpers();
    const body = await request.json();
    if (!body.reportId || !body.pageName) {
      return createErrorResponse('reportId and pageName are required', 400);
    }

    const { validateToken } = getAuthMiddleware();
    const { exchangeForPowerBIToken } = getAuthService();
    const { PowerBIService } = getPowerBIService();
    const format = body.format || 'PNG';
    const auth = await validateToken(request);
    const pbiToken = await exchangeForPowerBIToken(auth.token);
    const service = new PowerBIService(pbiToken);

    context.log(`Starting export for report ${body.reportId}, page ${body.pageName}, workspace ${body.workspaceId || 'my-workspace'}`);

    const exportId = await service.startExport(body.reportId, body.pageName, format, body.width, body.height, body.workspaceId);
    const status = await service.pollExportToCompletion(body.reportId, exportId, 300000, body.workspaceId);
    context.log(`Export completed: ${status.status}`);

    const fileBuffer = await service.getExportFile(body.reportId, exportId, body.workspaceId);
    const base64Image = fileBuffer.toString('base64');
    const mimeType = format === 'PNG' ? 'image/png' : 'application/pdf';

    return {
      status: 200,
      jsonBody: {
        image: base64Image,
        mimeType,
        reportId: body.reportId,
        pageName: body.pageName,
      },
    };
  } catch (error) {
    const { handleError } = getErrorHelpers();
    context.log('Export failed', error);
    return handleError(error);
  }
}

async function insights(request, context) {
  try {
    const { createErrorResponse, handleError } = getErrorHelpers();
    const body = await request.json();
    if (!body.reportId || !body.pageName) {
      return createErrorResponse('reportId and pageName are required', 400);
    }

    const { validateToken } = getAuthMiddleware();
    const { exchangeForOpenAIToken } = getAuthService();
    const { generateInsights } = getOpenAIService();
    const auth = await validateToken(request);
    const openAIToken = await exchangeForOpenAIToken(auth.token);

    context.log(`Generating insights for report ${body.reportId}, page ${body.pageName}`);

    const generatedInsights = await generateInsights({
      reportId: body.reportId,
      pageName: body.pageName,
      reportName: body.reportName,
      dataContext: body.dataContext,
      customPrompt: body.customPrompt,
      imageBase64: body.imageBase64,
      openAIToken,
    });

    return {
      status: 200,
      jsonBody: {
        insights: generatedInsights,
        generatedAt: new Date().toISOString(),
        model: process.env.AZURE_OPENAI_DEPLOYMENT || 'unknown',
      },
    };
  } catch (error) {
    const { handleError } = getErrorHelpers();
    context.log('Insights generation failed', error);
    return handleError(error);
  }
}

async function query(request, context) {
  try {
    const { createErrorResponse, handleError } = getErrorHelpers();
    const body = await request.json();
    if (!body.datasetId || !body.query) {
      return createErrorResponse('datasetId and query are required', 400);
    }

    const { validateToken } = getAuthMiddleware();
    const { exchangeForPowerBIToken } = getAuthService();
    const auth = await validateToken(request);
    const pbiToken = await exchangeForPowerBIToken(auth.token);

    context.log(`Executing DAX query on dataset ${body.datasetId}`);

    const response = await axios.post(
      `https://api.powerbi.com/v1.0/myorg/datasets/${encodeURIComponent(body.datasetId)}/executeQueries`,
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
    const { handleError } = getErrorHelpers();
    context.log('DAX query execution failed', error);
    return handleError(error);
  }
}

module.exports = {
  health,
  workspaces,
  reports,
  pages,
  exportPage,
  insights,
  query,
};
