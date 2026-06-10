import OpenAI from 'openai';
import { type CorrelatedIssue, type AIExplanation } from '@speed-doctor/shared-types';
import { getFallbackExplanation } from './fallbacks';

export async function explainIssue(issue: CorrelatedIssue): Promise<AIExplanation> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  if (!apiKey) {
    return getFallbackExplanation(issue.ruleId);
  }

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://speed-doctor.com',
      'X-Title': 'Speed Doctor',
    },
  });

  const prompt = `
You are a senior web performance expert. Explain the following web performance issue and write a developer-friendly fix with code examples.
If multiple elements are flagged (e.g., 'img.hero, img.footer'), summarize the affected areas (like 'hero section' or 'carousel') in your human-readable explanation instead of listing raw code selectors.
You MUST respond with a raw JSON object matching the TypeScript type below. Do not wrap in markdown code blocks. Just return the raw JSON.

TypeScript Interface:
interface AIExplanation {
  human: {
    title: string;
    explanation: string;
    businessImpact: string;
    fix: string;
  };
  developer: {
    title: string;
    rootCause: string;
    technicalImpact: string;
    codeExample: string;
    references: string[];
  };
}

Performance Issue:
- Rule ID: ${issue.ruleId}
- Category: ${issue.category}
- Severity: ${issue.severity}
- Affected Metrics: ${issue.affectedMetrics.join(', ') || 'general speed'}
- Estimated Impact Score: ${issue.estimatedImpactScore}
- Flagged Element/URL: ${issue.element || 'N/A'}
- Diagnostic Data: ${JSON.stringify(issue.data)}
  `;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a web performance recommendation engine. Output strict JSON only.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from AI model');

    // Strip any accidental markdown fences
    const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
    const explanation = JSON.parse(cleaned) as AIExplanation;

    if (explanation?.human && explanation?.developer) {
      return explanation;
    }

    throw new Error('AI response missing required fields (human / developer)');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    // Log with enough context to debug without exposing the full prompt
    console.warn(
      JSON.stringify({
        level: 'warn',
        service: 'ai-engine',
        event: 'ai_fallback',
        ruleId: issue.ruleId,
        model,
        reason: msg,
      }),
    );
    return getFallbackExplanation(issue.ruleId);
  }
}
