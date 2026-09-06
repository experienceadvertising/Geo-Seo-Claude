// Local fixtures only. Reject all non-loopback browser traffic.
import assert from 'node:assert/strict';
import { chromium } from '../artifacts/api-server/node_modules/playwright-core/index.mjs';
import { weeklyDigestEmail } from '../artifacts/api-server/src/lib/emailTemplates.ts';
import { nextOffsiteAction } from '../artifacts/api-server/src/lib/personalizedAction.ts';

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  const context = await browser.newContext();
  await context.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  const page = await context.newPage();
  await page.goto('http://localhost:4199/actions/1?task=add-faq#recommendations');
  await page.getByRole('heading', { name: 'Off-site work for example.com' }).waitFor();
  const task = page.locator('#offsite-work > div').filter({ has: page.getByRole('heading', { name: 'Align one company profile with your website', exact: true }) });
  await task.getByRole('textbox').fill('Corrected services at https://example.com/profile');
  await task.getByRole('button', { name: 'Record completed step', exact: true }).click();
  await task.getByRole('button', { name: 'Reopen step', exact: true }).waitFor();
  await page.reload();
  await task.getByRole('button', { name: 'Reopen step', exact: true }).waitFor();
  assert.equal(await task.getByRole('textbox').inputValue(), 'Corrected services at https://example.com/profile');
  const records = await (await context.request.get('http://localhost:4199/api/geo/recommendation-progress?domain=example.com')).json();
  const done = new Set(records.completed.map(row => row.recommendationId));
  assert.equal(nextOffsiteAction(done).id, 'offsite:expert-contribution');
  const email = weeklyDigestEmail({ firstName: 'Test', auditCount: 1, latestAudit: { id: 1, url: 'https://example.com/', createdAt: new Date(), geoScore: 54, quickWins: [], offsiteAction: nextOffsiteAction(done), completedThisWeek: records.completed.map(row => ({ title: 'Company profile corrected', completedAt: row.completedAt, note: row.implementationNote })) } });
  assert.match(email.text, /Corrected services at https:\/\/example.com\/profile/);
  assert.match(email.text, /Contribute useful expertise/);
  await task.getByRole('button', { name: 'Reopen step', exact: true }).click();
  await task.getByRole('button', { name: 'Record completed step', exact: true }).waitFor();
  const reopened = await (await context.request.get('http://localhost:4199/api/geo/recommendation-progress?domain=example.com')).json();
  assert.equal(reopened.completed.length, 0);
  assert.equal(nextOffsiteAction(new Set()).id, 'offsite:brand-profile');
  await page.getByRole('textbox', { name: /Implementation note/ }).fill('Added a buyer answer on the homepage');
  await page.getByRole('button', { name: 'I published this improvement', exact: true }).click();
  await page.getByRole('button', { name: 'Reopen task', exact: true }).waitFor();
  const onsite = await (await context.request.get('http://localhost:4199/api/geo/recommendation-progress?domain=example.com')).json();
  assert.equal(onsite.completed[0].implementationNote, 'Added a buyer answer on the homepage');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  console.log('PASS: off-site save, reload/note retention, reopening, next-task selection, weekly email record, on-site note, mobile width. Local fixtures only.');
} finally { await browser.close(); }
