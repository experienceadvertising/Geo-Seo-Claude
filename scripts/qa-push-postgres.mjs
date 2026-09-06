// Isolated PostgreSQL integration test. No production configuration is read.
// Uses the real notification routes with synthetic sessions and never sends a push.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import express from '../artifacts/api-server/node_modules/express/index.js';
import notificationsRouter from '../artifacts/api-server/src/routes/notifications.ts';
import { pool } from '../lib/db/src/index.ts';

let server;
try {
  assert.match(process.env.DATABASE_URL ?? '', /^postgresql:\/\/aeoqa@127\.0\.0\.1:55439\/aeo_paid_qa$/);
  await pool.query('CREATE TABLE push_subscriptions (id serial PRIMARY KEY, user_id text NOT NULL, endpoint text NOT NULL UNIQUE, p256dh text NOT NULL, auth text NOT NULL, last_error text, tasks_enabled boolean NOT NULL DEFAULT true, monitoring_enabled boolean NOT NULL DEFAULT true, strategies_enabled boolean NOT NULL DEFAULT true, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())');
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.session = { userId: req.headers['x-test-user'] }; next(); });
  app.use(notificationsRouter);
  server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const endpoint = 'https://push.example.test/subscription/browser-one';
  const subscription = { endpoint, keys: { p256dh: 'p'.repeat(32), auth: 'a'.repeat(24) } };
  const request = (path, options = {}, user) => fetch(`${base}${path}`, { ...options, headers: { 'content-type': 'application/json', ...(user ? { 'x-test-user': user } : {}), ...options.headers } });

  assert.equal((await request('/notifications/status')).status, 401);
  let response = await request('/notifications/status', {}, 'qa-a');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { configured: true, subscribed: false, publicKey: process.env.VAPID_PUBLIC_KEY });
  assert.equal((await request('/notifications/subscription', { method: 'POST', body: JSON.stringify({ endpoint: 'bad', keys: subscription.keys }) }, 'qa-a')).status, 400);
  assert.equal((await request('/notifications/subscription', { method: 'POST', body: JSON.stringify(subscription) }, 'qa-a')).status, 200);
  response = await request('/notifications/status', {}, 'qa-a');
  assert.equal((await response.json()).subscribed, true);
  assert.equal((await request('/notifications/subscription', { method: 'POST', body: JSON.stringify(subscription) }, 'qa-b')).status, 409);
  const body = JSON.stringify({ endpoint });
  assert.equal((await (await request('/notifications/status', { method: 'POST', body }, 'qa-a')).json()).subscribed, true);
  assert.equal((await (await request('/notifications/status', { method: 'POST', body }, 'qa-b')).json()).subscribed, false);
  const preferences = JSON.stringify({ endpoint, tasksEnabled: false, monitoringEnabled: true, strategiesEnabled: false });
  assert.equal((await request('/notifications/preferences', { method: 'PATCH', body: preferences }, 'qa-b')).status, 409);
  assert.equal((await request('/notifications/preferences', { method: 'PATCH', body: preferences }, 'qa-a')).status, 200);
  const state = await (await request('/notifications/status', { method: 'POST', body }, 'qa-a')).json();
  assert.equal(state.preferences.tasksEnabled, false);
  assert.equal(state.preferences.monitoringEnabled, true);
  assert.equal(state.preferences.strategiesEnabled, false);
  await pool.query("CREATE TABLE users (id text PRIMARY KEY, email_verified boolean, email_opt_out boolean, email text)");
  await pool.query("INSERT INTO users VALUES ('qa-a',true,true,'a@example.test'),('qa-b',true,false,'b@example.test')");
  await pool.query("CREATE TABLE scheduled_job_items (job text, slot text, subject_id text, expires_at timestamp, UNIQUE(job,slot,subject_id))");
  const schedulerSource = await readFile(new URL('../artifacts/api-server/src/lib/cloudflareScheduler.ts', import.meta.url), 'utf8');
  const queueSql = [...schedulerSource.matchAll(/client\.query\(`([\s\S]*?)`/g)].map(match => match[1]).find(sql => sql.includes('FROM users'));
  assert.ok(queueSql);
  await pool.query("UPDATE push_subscriptions SET tasks_enabled=true WHERE user_id='qa-a'");
  await pool.query(queueSql, ['weekly-digest','test1',true,true]);
  assert.deepEqual((await pool.query("SELECT subject_id FROM scheduled_job_items WHERE slot='test1' ORDER BY subject_id")).rows.map(row => row.subject_id), ['qa-a','qa-b']);
  await pool.query(queueSql, ['weekly-insights','test2',true,true]);
  assert.deepEqual((await pool.query("SELECT subject_id FROM scheduled_job_items WHERE slot='test2'")).rows.map(row => row.subject_id), ['qa-b']);
  await pool.query(queueSql, ['weekly-digest','test3',false,true]);
  assert.deepEqual((await pool.query("SELECT subject_id FROM scheduled_job_items WHERE slot='test3'")).rows.map(row => row.subject_id), ['qa-a']);
  assert.equal((await request('/notifications/subscription', { method: 'DELETE', body: JSON.stringify({ endpoint }) }, 'qa-b')).status, 200);
  assert.equal((await (await request('/notifications/status', {}, 'qa-a')).json()).subscribed, true);
  assert.equal((await request('/notifications/subscription', { method: 'DELETE', body: JSON.stringify({ endpoint }) }, 'qa-a')).status, 200);
  assert.equal((await (await request('/notifications/status', {}, 'qa-a')).json()).subscribed, false);
  console.log('PASS: notification routes enforce auth, validate input, isolate subscriptions by account, preserve another account subscription, and delete only the owner subscription. No push sent.');
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  await pool.end();
}
