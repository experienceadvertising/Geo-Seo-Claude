// Isolated PostgreSQL integration test. No production configuration is read.
// Uses the actual route source and auth middleware; sessions are synthetic.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import express from '../artifacts/api-server/node_modules/express/index.js';
import { transform } from '../artifacts/api-server/node_modules/esbuild/lib/main.js';
import pg from '../lib/db/node_modules/pg/lib/index.js';
import { drizzle } from '../lib/db/node_modules/drizzle-orm/node-postgres/index.js';
import { eq, and } from '../lib/db/node_modules/drizzle-orm/index.js';
import { recommendationProgressTable } from '../lib/db/src/schema/recommendationProgress.ts';
import { requireAuth } from '../artifacts/api-server/src/middlewares/auth.ts';
import { weeklyDigestEmail } from '../artifacts/api-server/src/lib/emailTemplates.ts';
import { nextOffsiteAction } from '../artifacts/api-server/src/lib/personalizedAction.ts';

const pool = new pg.Pool({ host: '127.0.0.1', port: 55439, user: 'aeo_test', database: 'postgres' });
let server;
try {
  await pool.query('CREATE TABLE recommendation_progress (id serial PRIMARY KEY, user_id text NOT NULL, domain text NOT NULL, recommendation_id text NOT NULL, implementation_note text, completed_at timestamp NOT NULL DEFAULT now(), UNIQUE(user_id,domain,recommendation_id))');
  const db = drizzle(pool);
  const source = readFileSync(new URL('../artifacts/api-server/src/routes/geo/index.ts', import.meta.url), 'utf8');
  const start = source.indexOf('function normalizeDomain(');
  const end = source.indexOf('router.post("/geo/analyze"');
  assert.ok(start > 0 && end > start);
  const { code } = await transform(source.slice(start, end), { loader: 'ts' });
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => { req.session = { userId: req.headers['x-test-user'] }; next(); });
  new Function('router', 'db', 'recommendationProgressTable', 'eq', 'and', 'requireAuth', 'readRateLimiter', code)(app, db, recommendationProgressTable, eq, and, requireAuth, (_req, _res, next) => next());
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/geo/recommendation-progress`;
  const get = async (user, domain = 'example.com') => fetch(`${base}?domain=${domain}`, { headers: user ? { 'x-test-user': user } : {} });
  const post = async (user, values) => fetch(base, { method: 'POST', headers: { 'content-type': 'application/json', 'x-test-user': user }, body: JSON.stringify({ domain: 'example.com', recommendationId: 'offsite:brand-profile', completed: true, ...values }) });
  assert.equal((await get()).status, 401);
  assert.equal((await post('qa-a', { implementationNote: ' Corrected company profile ' })).status, 200);
  let rows = (await (await get('qa-a')).json()).completed;
  assert.equal(rows[0].implementationNote, 'Corrected company profile');
  assert.equal((await (await get('qa-b')).json()).completed.length, 0);
  assert.equal((await (await get('qa-a', 'other.example')).json()).completed.length, 0);
  await post('qa-a', { implementationNote: 'Updated profile details' });
  rows = (await (await get('qa-a')).json()).completed;
  assert.equal(rows.length, 1);
  const offsiteAction = nextOffsiteAction(new Set(rows.map(row => row.recommendationId)));
  assert.equal(offsiteAction.id, 'offsite:expert-contribution');
  const email = weeklyDigestEmail({ firstName: 'QA', auditCount: 1, latestAudit: { id: 1, url: 'https://example.com', createdAt: new Date(), geoScore: 50, quickWins: [], offsiteAction, completedThisWeek: rows.map(row => ({ title: 'Profile corrected', completedAt: row.completedAt, note: row.implementationNote })) } });
  assert.match(email.text, /Updated profile details/);
  assert.match(email.text, /Contribute useful expertise/);
  await post('qa-b', { completed: false });
  assert.equal((await (await get('qa-a')).json()).completed.length, 1);
  await post('qa-a', { completed: false });
  assert.equal((await (await get('qa-a')).json()).completed.length, 0);
  assert.equal((await post('qa-a', { recommendationId: '<invalid>' })).status, 400);
  console.log('PASS: actual progress handlers + PostgreSQL: unauthenticated rejection, save/read, notes, upsert, user/domain isolation, cross-user reopen isolation, reopen, invalid ID, personalized weekly rendering. No email sent.');
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  await pool.end();
}
