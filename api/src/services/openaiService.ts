import axios from 'axios';
import { DefaultAzureCredential } from '@azure/identity';
import { InsightContext, InsightItem } from '../types/insights.js';

// ── Environment configuration (read lazily so tests can set process.env) ─────

const AZURE_OPENAI_SCOPE = 'https://cognitiveservices.azure.com/.default';

// Singleton credential — uses Managed Identity in Azure, developer credentials locally
let credential: DefaultAzureCredential | null = null;

function getCredential(): DefaultAzureCredential {
  if (!credential) {
    credential = new DefaultAzureCredential();
  }
  return credential;
}

// ── System prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an executive insights analyst. Given the following Power BI report data, generate 3-5 concise, actionable insights suitable for an executive presentation. Format each insight as a bullet point with a bold headline.

Each insight MUST have:
- A **bold headline** (short, actionable phrase)
- A detail sentence expanding on the headline
- An optional category (e.g. "Revenue", "Risk", "Growth", "Efficiency")

Respond ONLY with a JSON array of objects with keys: "headline", "detail", "category".
Do not include any text outside the JSON array.`;

// ── Auth header builder ─────────────────────────────────────────────────────

/** Build auth headers: prefer OBO token, fall back to Managed Identity (DefaultAzureCredential). */
async function buildAuthHeaders(oboToken?: string): Promise<Record<string, string>> {
  if (oboToken) {
    return { Authorization: `Bearer ${oboToken}` };
  }
  // Fallback: acquire token via DefaultAzureCredential (Managed Identity in Azure, CLI/VS Code locally)
  const tokenResponse = await getCredential().getToken(AZURE_OPENAI_SCOPE);
  if (!tokenResponse?.token) {
    throw new Error('Failed to acquire Azure OpenAI token via Managed Identity (DefaultAzureCredential)');
  }
  return { Authorization: `Bearer ${tokenResponse.token}` };
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function generateInsights(context: InsightContext): Promise<InsightItem[]> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || '';
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';

  if (!endpoint) {
    throw new Error('AZURE_OPENAI_ENDPOINT environment variable is not configured');
  }
  if (!deployment) {
    throw new Error('AZURE_OPENAI_DEPLOYMENT environment variable is not configured');
  }

  const userMessage = buildUserMessage(context);
  const url = `${endpoint.replace(/\/+$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  try {
    const response = await axios.post(
      url,
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(await buildAuthHeaders(context.openAIToken)),
        },
        timeout: 60_000,
      },
    );

    const content = response.data?.choices?.[0]?.message?.content;
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
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as Record<string, unknown> | undefined;
    const innerMsg = data?.error
      ? JSON.stringify(data.error)
      : error.message;

    if (status === 401) {
      throw new Error('Azure OpenAI: unauthorized – token may be invalid or expired');
    }
    if (status === 429) {
      throw new Error('Azure OpenAI: rate limit exceeded – try again later');
    }
    if (innerMsg.includes('content_filter') || innerMsg.includes('ContentFilter')) {
      throw new Error('Azure OpenAI: response was filtered by content safety policy');
    }
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new Error('Azure OpenAI: request timed out');
    }
    throw new Error(`Azure OpenAI error (${status ?? 'unknown'}): ${innerMsg}`);
  }
  throw error;
}
