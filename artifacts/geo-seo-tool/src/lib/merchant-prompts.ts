/** Manual observations produce synthetic questions, never measured queries. */
export function merchantPrompts(category: string, observation: string): string[] {
  const clean = (value: string) => value.replace(/\s+/g, " ").trim().slice(0, 160);
  const product = clean(category);
  const need = clean(observation);
  if (!product || !need) return [];
  return [
    `What should I look for in ${product} when ${need} matters?`,
    `How should I compare ${product} for ${need}, including tradeoffs?`,
    `Before buying ${product} for ${need}, which specifications should I verify?`,
  ];
}

export function appendWithinLimit(existing: string, additions: string[], limit: number): string {
  const current = existing.split("\n").map(s => s.trim()).filter(Boolean);
  const available = Math.max(0, Math.floor(limit) - current.length);
  const unique = [...new Set(additions)].filter(s => !current.includes(s));
  return [...current, ...unique.slice(0, available)].join("\n");
}
