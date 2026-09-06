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
  const email = simulationCompleteEmail("Jamie", "example.com", 0, 46, "https://example.com/preferences", { answers, audit: { url: "https://example.com/services", createdAt: "2026-09-06T12:00:00Z", nextAction: { id: "content-effort-methodology", title: "Show how your service works", detail: "The saved audit found no visible methodology on the services page. Add the steps customers can expect and one documented example." }, offsiteAction: { title: "Align your company profile", steps: "Compare a profile you control with the services and audience described on your website. Correct conflicting facts and record the public URL.", verify: "Reopen the profile and confirm your changes are visible." } } });
  writeFileSync(join(directory, `${name}.html`), email.html);
  writeFileSync(join(directory, `${name}.txt`), `${email.subject}\n\n${email.text}`);
}
console.log(`Wrote three synthetic previews to ${directory}. No emails sent.`);
