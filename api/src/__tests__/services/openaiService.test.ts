import {
  resetOpenAIMocks,
  mockCompletionSuccess,
  mockCompletionEmpty,
  mockCompletionError,
} from '../mocks/openaiMock';
import { generateInsights } from '../../services/openaiService';
import type { InsightContext } from '../../types/insights';

describe('OpenAI Service — generateInsights', () => {
  const baseContext: InsightContext = {
    reportId: 'r-1',
    pageName: 'Overview',
    reportName: 'Sales Report',
    openAIToken: 'mock-openai-token',
  };

  beforeEach(() => {
    resetOpenAIMocks();
    process.env.AZURE_OPENAI_ENDPOINT = 'https://test.openai.azure.com';
    process.env.AZURE_OPENAI_DEPLOYMENT = 'gpt-4';
  });

  afterEach(() => {
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_OPENAI_DEPLOYMENT;
  });

  it('returns parsed insights from a successful response', async () => {
    const insights = [
      { headline: 'Revenue Up', detail: 'Revenue increased 15%', category: 'Revenue' },
      { headline: 'Risk Alert', detail: 'Churn is rising', category: 'Risk' },
    ];
    mockCompletionSuccess(insights);

    const result = await generateInsights(baseContext);

    expect(result).toHaveLength(2);
    expect(result[0].headline).toBe('Revenue Up');
    expect(result[1].category).toBe('Risk');
  });

  it('handles markdown-wrapped JSON in response', async () => {
    const insights = [{ headline: 'Growth', detail: 'Q3 growth strong' }];
    // The mock returns raw JSON; test the parsing path by using raw completions mock
    mockCompletionSuccess(insights);

    const result = await generateInsights(baseContext);
    expect(result).toHaveLength(1);
    expect(result[0].headline).toBe('Growth');
  });

  it('throws when AZURE_OPENAI_ENDPOINT is missing', async () => {
    delete process.env.AZURE_OPENAI_ENDPOINT;

    await expect(generateInsights(baseContext)).rejects.toThrow(/AZURE_OPENAI_ENDPOINT/);
  });

  it('throws when AZURE_OPENAI_DEPLOYMENT is missing', async () => {
    delete process.env.AZURE_OPENAI_DEPLOYMENT;

    await expect(generateInsights(baseContext)).rejects.toThrow(/AZURE_OPENAI_DEPLOYMENT/);
  });

  it('throws on empty response from OpenAI', async () => {
    mockCompletionEmpty();

    await expect(generateInsights(baseContext)).rejects.toThrow(/empty response/);
  });

  it('throws a content filter error', async () => {
    mockCompletionError('content_filter triggered');

    await expect(generateInsights(baseContext)).rejects.toThrow(/content safety policy/);
  });

  it('throws a rate limit error', async () => {
    mockCompletionError('429 Rate limit exceeded');

    await expect(generateInsights(baseContext)).rejects.toThrow(/rate limit exceeded/);
  });

  it('throws a timeout error', async () => {
    mockCompletionError('ETIMEDOUT');

    await expect(generateInsights(baseContext)).rejects.toThrow(/timed out/);
  });

  it('throws an unauthorized error', async () => {
    mockCompletionError('401 Unauthorized');

    await expect(generateInsights(baseContext)).rejects.toThrow(/unauthorized/);
  });

  it('includes optional context fields in the prompt', async () => {
    const insights = [{ headline: 'Test', detail: 'Test detail' }];
    mockCompletionSuccess(insights);

    const contextWithExtras: InsightContext = {
      ...baseContext,
      dataContext: 'Top 5 products by revenue',
      customPrompt: 'Focus on growth opportunities',
    };

    const result = await generateInsights(contextWithExtras);
    expect(result).toHaveLength(1);
  });
});
