/**
 * Shared OpenAI mock helpers for backend tests.
 * The openaiService calls axios.post directly against Azure OpenAI.
 */

import axios from 'axios';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

export function resetOpenAIMocks(): void {
  mockedAxios.post.mockReset();
  // Make isAxiosError recognise our mock errors
  (mockedAxios.isAxiosError as unknown as jest.Mock).mockImplementation(
    (e: unknown) => !!(e && typeof e === 'object' && (e as Record<string, unknown>).isAxiosError),
  );
}

/** Simulate a successful chat completion with JSON insights. */
export function mockCompletionSuccess(insights: unknown[]): void {
  mockedAxios.post.mockResolvedValue({
    data: {
      choices: [
        {
          message: { content: JSON.stringify(insights) },
        },
      ],
    },
  });
}

/** Simulate an empty response. */
export function mockCompletionEmpty(): void {
  mockedAxios.post.mockResolvedValue({
    data: { choices: [{ message: { content: null } }] },
  });
}

/** Simulate an OpenAI error. */
export function mockCompletionError(message: string): void {
  const error = new Error(message) as Error & {
    isAxiosError: boolean;
    response?: { status: number; data: unknown };
    code?: string;
  };
  error.isAxiosError = true;

  if (message.includes('401')) {
    error.response = { status: 401, data: {} };
  } else if (message.includes('429')) {
    error.response = { status: 429, data: {} };
  } else if (message.includes('ETIMEDOUT')) {
    error.code = 'ETIMEDOUT';
  } else if (message.includes('content_filter')) {
    error.response = { status: 400, data: { error: { code: 'content_filter', message } } };
  }

  mockedAxios.post.mockRejectedValue(error);
}

export { mockedAxios };
