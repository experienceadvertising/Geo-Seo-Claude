const QUESTION_START = /^(?:how|what|which|who|where|when|why|should|can|could|does|do|is|are|will|would)\b/i;

function cleanFragment(value: string): string {
  return value
    .replace(/^[\d.\-\)\s"'*]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "")
    .trim();
}

function lowerFirst(value: string): string {
  return value ? value[0].toLowerCase() + value.slice(1) : value;
}

function hiringPhrase(value: string): string {
  const trimmed = value.trim();
  const hiring = trimmed.match(/^hiring\s+(.+)$/i);
  if (!hiring) return lowerFirst(trimmed);
  const role = hiring[1].trim();
  const article = /^(?:a|an|the)\b/i.test(role) ? "" : "a ";
  return `hire ${article}${lowerFirst(role)}`;
}

/**
 * Turns model output into a complete buyer-style question. AI search users
 * often type fragments, but a complete question is easier for customers to
 * understand, edit, and reuse across engines.
 */
export function normalizeGeneratedPromptLine(raw: string): string | null {
  let value = cleanFragment(raw);
  if (!value) return null;

  const comparison = value.match(/^(.*?)\s+vs\.?\s+(.*?)(?:\s+pros?\s+and\s+cons?)?$/i);
  if (comparison) {
    const left = lowerFirst(comparison[1].trim());
    const right = hiringPhrase(comparison[2]);
    value = `Should I choose ${left} or ${right}`;
  } else if (/^how\s+to\s+/i.test(value)) {
    value = value.replace(/^how\s+to\s+/i, "How can I ");
  } else if (/^(?:set up|build|create|manage|scale|improve|hire)\b/i.test(value)) {
    value = `Who can help me ${lowerFirst(value)}`;
  } else if (/^best\s+/i.test(value)) {
    value = `What are the ${lowerFirst(value)}`;
  } else if (!QUESTION_START.test(value)) {
    value = `What should I know about ${lowerFirst(value)}`;
  }

  value = value.replace(/\s+/g, " ").trim();
  const wordCount = value.split(/\s+/).length;
  if (wordCount < 6 || wordCount > 24) return null;
  return `${value}?`;
}

export function normalizeGeneratedPrompts(text: string, maxPrompts = 3): string[] {
  const seen = new Set<string>();
  const prompts: string[] = [];
  for (const line of text.split("\n")) {
    const prompt = normalizeGeneratedPromptLine(line);
    if (!prompt) continue;
    const key = prompt.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    prompts.push(prompt);
    if (prompts.length >= maxPrompts) break;
  }
  return prompts;
}
