import { HttpResponseInit } from '@azure/functions';

export interface ApiError {
  error: string;
  code: number;
}

export function createErrorResponse(message: string, code: number = 500): HttpResponseInit {
  return {
    status: code,
    jsonBody: { error: message, code } as ApiError
  };
}

export function handleError(error: unknown): HttpResponseInit {
  // Axios errors carry the upstream HTTP status
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosErr = error as { response?: { status?: number; data?: { error?: { message?: string } } }; message?: string };
    const status = axiosErr.response?.status;
    const msg = axiosErr.response?.data?.error?.message || (axiosErr as Error).message || 'Upstream request failed';
    if (status === 401 || status === 403) return createErrorResponse(msg, status);
    if (status === 404) return createErrorResponse(msg, 404);
    if (status === 429) return createErrorResponse('Too many requests — please retry later', 429);
    if (status) return createErrorResponse(msg, status >= 400 && status < 600 ? status : 500);
  }

  if (error instanceof Error) {
    if (error.message.includes('authorization') || error.message.includes('Token')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse(error.message, 500);
  }
  return createErrorResponse('An unknown error occurred', 500);
}
