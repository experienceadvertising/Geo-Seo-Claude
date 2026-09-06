// Local-only dashboard QA. It blocks external requests and denies notification
// permission after the click so no subscription or push can be created.
import assert from 'node:assert/strict';
import { chromium } from '../artifacts/api-server/node_modules/playwright-core/index.mjs';

const base = process.env.QA_URL || 'http://localhost:4200';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await context.addInitScript(() => {
    window.__qaPermissionRequests = 0;
    if ('Notification' in window) Object.defineProperty(Notification, 'requestPermission', { configurable: true, value: async () => { window.__qaPermissionRequests += 1; return 'denied'; } });
  });
  const page = await context.newPage();
  await page.goto(base);
  await page.getByRole('heading', { name: 'Next-task notifications' }).waitFor();
  assert.equal(await page.evaluate(() => window.__qaPermissionRequests), 0);
  const mainTask = page.getByLabel('Your next improvement');
  await mainTask.getByText('Answer a relevant buyer question', { exact: true }).waitFor();
  const mainHref = await mainTask.getByRole('link', { name: /Work on this improvement/ }).getAttribute('href');
  assert.equal(mainHref, '/actions/1?task=direct-answer-block#recommendations');
  const sideTask = page.getByLabel('Latest audit results').getByText('Answer a relevant buyer question', { exact: true });
  await sideTask.waitFor();
  assert.equal(await sideTask.locator('xpath=ancestor::a').getAttribute('href'), mainHref);
  await page.getByRole('button', { name: 'Enable notifications' }).click();
  assert.equal(await page.evaluate(() => window.__qaPermissionRequests), 1);
  await page.getByText("This browser blocked notifications. Allow notifications for aeoimprovement.com in your browser's site settings, then try again.").waitFor();
  console.log('PASS: dashboard and sidebar use the same task and link; notification permission is requested only after a user click. No subscription or push created.');
} finally {
  await browser.close();
}
