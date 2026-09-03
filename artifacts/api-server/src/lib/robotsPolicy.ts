export interface RobotsRule { allow: boolean; pattern: string }

export function parseRobotsTxt(robotsTxt: string): Map<string, RobotsRule[]> {
  const rules = new Map<string, RobotsRule[]>();
  let currentAgents: string[] = [];
  let collectingAgents = false;
  for (const rawLine of robotsTxt.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, "").trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (field === "user-agent") {
      if (!collectingAgents) currentAgents = [];
      const agent = value.toLowerCase();
      currentAgents.push(agent);
      // Register the group even if it ends up with no rules: "User-agent:
      // GPTBot\nDisallow:" is the standard allow-everything idiom and must
      // override a restrictive "*" group rather than fall through to it.
      if (!rules.has(agent)) rules.set(agent, []);
      collectingAgents = true;
      continue;
    }
    if (field !== "allow" && field !== "disallow") continue;
    collectingAgents = false;
    if (!value) continue;
    for (const agent of currentAgents) {
      const list = rules.get(agent) ?? [];
      list.push({ allow: field === "allow", pattern: value });
      rules.set(agent, list);
    }
  }
  return rules;
}

function matches(pattern: string, pathname: string): boolean {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const escaped = body.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}${anchored ? "$" : ""}`).test(pathname);
}

export function isAllowedByRobots(rules: Map<string, RobotsRule[]>, agent: string, pathname: string): boolean {
  const specific = rules.get(agent);
  const candidates = specific ?? (rules.get("*") ?? []);
  const matching = candidates.filter((rule) => matches(rule.pattern, pathname));
  if (matching.length === 0) return true;
  const specificity = (rule: RobotsRule) => rule.pattern.replace(/\*|\$$/g, "").length;
  const longest = Math.max(...matching.map(specificity));
  return matching.some((rule) => rule.allow && specificity(rule) === longest);
}
