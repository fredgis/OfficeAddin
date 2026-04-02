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
  if (error instanceof Error) {
    if (error.message.includes('authorization')) {
      return createErrorResponse(error.message, 401);
    }
    return createErrorResponse(error.message, 500);
  }
  return createErrorResponse('An unknown error occurred', 500);
}
