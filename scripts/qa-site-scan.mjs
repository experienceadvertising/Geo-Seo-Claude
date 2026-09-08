import assert from 'node:assert/strict';
import { chromium } from '../artifacts/api-server/node_modules/playwright-core/index.mjs';
const browser = await chromium.launch({executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true});
const page = await browser.newPage();
try {
  page.setDefaultTimeout(10000);
  let scans = 0;
  await page.route('**/*', route => ['localhost','127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await page.route('**/api/geo/analyze', route => { scans++; assert.equal(route.request().postDataJSON().siteScan, true); return route.fulfill({status: 429, contentType: 'application/json', body: JSON.stringify({error: 'Fixture quota reached'})}); });
  await page.goto('http://localhost:4211/site-scan?url=https%3A%2F%2Fexample.com%2F');
  await page.getByRole('heading',{name: 'Your next three page improvements'}).waitFor();
  assert.equal(scans, 0);
  await page.getByRole('button',{name: 'Find important pages'}).click();
  await page.getByLabel('Select Homepage for scanning').check();
  await page.getByRole('button',{name: 'Scan 2 selected pages'}).click();
  await page.getByRole('alert').getByText(/Fixture quota reached/).waitFor();
  assert.equal(scans, 1, 'batch stops after first failure');
  await page.getByRole('combobox').selectOption('2');
  await page.getByText(/More words are not automatically better/).waitFor();
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({path:'/tmp/aeo-site-scan-mobile.png',fullPage:true});
  console.log('PASS: site scan paid fixture, explicit scans only, failure stops queue, competitor comparison and mobile width. No external calls.');
} catch (error) { console.error((await page.locator('body').innerText()).slice(0, 1800)); throw error; } finally { await browser.close(); }
