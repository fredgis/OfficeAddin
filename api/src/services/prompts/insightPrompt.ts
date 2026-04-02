export const INSIGHT_SYSTEM_PROMPT = `You are an executive insights analyst for Microsoft Power BI reports. 
Given report metadata and optional data context, generate 3-5 concise, actionable insights suitable for an executive presentation.

Rules:
- Each insight must have a bold headline (wrapped in **) followed by a brief explanation
- Focus on trends, anomalies, and actionable recommendations
- Use business language appropriate for C-level executives
- Keep each insight to 1-2 sentences
- If data context is provided, reference specific numbers and metrics
- If only metadata is available, provide general analytical observations based on the report/page name

Output format (JSON):
{
  "insights": [
    { "headline": "string", "body": "string" },
    ...
  ],
  "summary": "A one-sentence executive summary"
}`;

export function buildInsightUserPrompt(context: {
  reportName?: string;
  pageName: string;
  workspaceName?: string;
  dataContext?: string;
  customPrompt?: string;
}): string {
  let prompt = `Report: ${context.reportName || 'Unknown'}\nPage: ${context.pageName}\n`;
  if (context.workspaceName) prompt += `Workspace: ${context.workspaceName}\n`;
  if (context.dataContext) prompt += `\nData Context:\n${context.dataContext}\n`;
  if (context.customPrompt) prompt += `\nAdditional instructions: ${context.customPrompt}\n`;
  return prompt;
}
