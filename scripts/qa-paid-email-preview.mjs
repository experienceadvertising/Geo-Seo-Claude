// Render synthetic emails only. No email sender, customer data or provider calls.
import assert from 'node:assert/strict';
import { chromium } from '../artifacts/api-server/node_modules/playwright-core/index.mjs';
import { weeklyDigestEmail, aeoInsightsEmail } from '../artifacts/api-server/src/lib/emailTemplates.ts';
const directory = process.env.QA_ARTIFACT_DIR;
assert.ok(directory?.startsWith('/tmp/aeo-paid-qa.'));
const digest = weeklyDigestEmail({ firstName: 'Jamie', planName: 'Agency', paidSeoEnabled: true, auditCount: 3,
  latestAudit: { id: 1, url: 'https://example.com/services', createdAt: new Date('2026-09-06'), geoScore: 54, quickWins: [], nextAction: { id: 'direct-answer-block', title: 'Answer the analytics setup question on your services page', detail: 'The saved scan found no direct answer near the start of this page. Add a short explanation of what your service includes and which teams it helps.' }, completedActions: 1 },
  tracking: { activeKeywords: 5, rankedKeywords: 4, pendingKeywords: 1, staleKeywords: 1, foundKeywords: 3 },
  clientSummaries: [{ auditId: 1, url: 'https://example.com/services', nextTask: { id: 'direct-answer-block', title: 'Answer the analytics setup question' }, activeKeywords: 5, collectedKeywords: 4, staleKeywords: 1 }, { auditId: 2, url: 'https://second.example/about', nextTask: { id: 'content-effort-methodology', title: 'Show how you evaluate supplier lead times' }, activeKeywords: 2, collectedKeywords: 0, staleKeywords: 0 }],
  monitoring: { activeSites: 2, waitingForFirstRun: 1 }, googleMeasurementConnected: true,
});
const strategy = aeoInsightsEmail('Jamie', 1, undefined, { pageUrl: 'https://example.com/services', title: 'Add a documented example of your analytics process', url: 'https://aeoimprovement.com/actions/1?task=first-party-data#recommendations' });
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  const page = await browser.newPage();
  await page.route('**/*', route => route.abort());
  for (const [name, email] of [['weekly-agency', digest], ['strategy', strategy]]) {
    await page.setViewportSize({ width: 800, height: 900 });
    await page.setContent(email.html);
    await page.screenshot({ path: `${directory}/${name}-desktop.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `${directory}/${name}-mobile.png`, fullPage: true });
  }
  console.log('PASS: personalized Agency digest and strategy emails render without horizontal overflow on desktop and mobile. No email sent.');
} finally { await browser.close(); }
