// Isolated PostgreSQL integration test. No production configuration is read.
// Uses the real notification routes with synthetic sessions and never sends a push.
import assert from 'node:assert/strict';
import express from '../artifacts/api-server/node_modules/express/index.js';
import notificationsRouter from '../artifacts/api-server/src/routes/notifications.ts';
import { pool } from '../lib/db/src/index.ts';

let server;
try {
  await pool.query('CREATE TABLE push_subscriptions (id serial PRIMARY KEY, user_id text NOT NULL, endpoint text NOT NULL UNIQUE, p256dh text NOT NULL, auth text NOT NULL, last_error text, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())');
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
  assert.equal((await request('/notifications/subscription', { method: 'DELETE', body: JSON.stringify({ endpoint }) }, 'qa-b')).status, 200);
  assert.equal((await (await request('/notifications/status', {}, 'qa-a')).json()).subscribed, true);
  assert.equal((await request('/notifications/subscription', { method: 'DELETE', body: JSON.stringify({ endpoint }) }, 'qa-a')).status, 200);
  assert.equal((await (await request('/notifications/status', {}, 'qa-a')).json()).subscribed, false);
  console.log('PASS: notification routes enforce auth, validate input, isolate subscriptions by account, preserve another account subscription, and delete only the owner subscription. No push sent.');
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  await pool.end();
}
