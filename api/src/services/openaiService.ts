import { OpenAIClient } from '@azure/openai';
import { TokenCredential, AccessToken, GetTokenOptions } from '@azure/core-auth';
import { InsightContext, InsightItem } from '../types/insights.js';

// ── Environment configuration ───────────────────────────────────────────────

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || '';
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';

// ── Token credential wrapper ────────────────────────────────────────────────

/** Wraps a static OBO token as a TokenCredential for the Azure OpenAI SDK. */
class StaticTokenCredential implements TokenCredential {
  constructor(private token: string) {}

  async getToken(_scopes: string | string[], _options?: GetTokenOptions): Promise<AccessToken> {
    return { token: this.token, expiresOnTimestamp: Date.now() + 3600 * 1000 };
  }
}

// ── System prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an executive insights analyst for Power BI reports.
Given information about a report page, generate 3-5 concise executive insights.

Each insight MUST have:
- A **bold headline** (short, actionable phrase)
- A detail sentence expanding on the headline
- An optional category (e.g. "Revenue", "Risk", "Growth", "Efficiency")

Respond ONLY with a JSON array of objects with keys: "headline", "detail", "category".
Do not include any text outside the JSON array.`;

// ── Public API ──────────────────────────────────────────────────────────────

export async function generateInsights(context: InsightContext): Promise<InsightItem[]> {
  if (!AZURE_OPENAI_ENDPOINT) {
    throw new Error('AZURE_OPENAI_ENDPOINT environment variable is not configured');
  }
  if (!AZURE_OPENAI_DEPLOYMENT) {
    throw new Error('AZURE_OPENAI_DEPLOYMENT environment variable is not configured');
  }

  const credential = new StaticTokenCredential(context.openAIToken);
  const client = new OpenAIClient(AZURE_OPENAI_ENDPOINT, credential, {
    apiVersion: AZURE_OPENAI_API_VERSION,
  });

  const userMessage = buildUserMessage(context);

  try {
    const response = await client.getChatCompletions(AZURE_OPENAI_DEPLOYMENT, [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ], {
      temperature: 0.7,
      maxTokens: 1024,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Azure OpenAI returned an empty response');
    }

    return parseInsights(content);
  } catch (error: unknown) {
    handleOpenAIError(error);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildUserMessage(context: InsightContext): string {
  const parts: string[] = [
    `Report: ${context.reportName || context.reportId}`,
    `Page: ${context.pageName}`,
  ];

  if (context.dataContext) {
    parts.push(`Data context: ${context.dataContext}`);
  }

  if (context.customPrompt) {
    parts.push(`Additional instructions: ${context.customPrompt}`);
  }

  return parts.join('\n');
}

function parseInsights(content: string): InsightItem[] {
  // Strip markdown code fences if the model wraps the response
  const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse insights response as JSON');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Insights response is not an array');
  }

  return parsed.map((item: Record<string, unknown>) => ({
    headline: String(item.headline ?? ''),
    detail: String(item.detail ?? ''),
    category: item.category ? String(item.category) : undefined,
  }));
}

function handleOpenAIError(error: unknown): never {
  if (error instanceof Error) {
    const msg = error.message || '';

    if (msg.includes('content_filter') || msg.includes('ContentFilter')) {
      throw new Error('Azure OpenAI: response was filtered by content safety policy');
    }
    if (msg.includes('429') || msg.includes('Rate limit')) {
      throw new Error('Azure OpenAI: rate limit exceeded – try again later');
    }
    if (msg.includes('timeout') || msg.includes('ETIMEDOUT')) {
      throw new Error('Azure OpenAI: request timed out');
    }
    if (msg.includes('401') || msg.includes('Unauthorized')) {
      throw new Error('Azure OpenAI: unauthorized – token may be invalid or expired');
    }
  }
  throw error;
}
