// Offline fixtures only. Does not import the sender or contact any provider.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { simulationCompleteEmail } from "../artifacts/api-server/src/lib/emailTemplates.ts";

const directory = process.argv[2];
if (!directory) throw new Error("Pass an output directory for synthetic email previews.");
mkdirSync(directory, { recursive: true });
const scenarios = {
  "no-mentions": Array.from({ length: 3 }, () => ({ error: null, brandMentioned: false, domainCited: false })),
  "partial-results": [{ error: null, brandMentioned: true, domainCited: false }, { error: "synthetic failure", brandMentioned: false, domainCited: false }],
  "provider-unavailable": [{ error: "synthetic failure", brandMentioned: false, domainCited: false }],
};
for (const [name, answers] of Object.entries(scenarios)) {
  const email = simulationCompleteEmail("Jamie", "example.com", 0, 46, "https://example.com/preferences", { answers });
  writeFileSync(join(directory, `${name}.html`), email.html);
  writeFileSync(join(directory, `${name}.txt`), `${email.subject}\n\n${email.text}`);
}
console.log(`Wrote three synthetic previews to ${directory}. No emails sent.`);
