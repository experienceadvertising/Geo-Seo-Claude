// Local-only UI fixtures. Never connects to production APIs, sends email,
// runs an audit, or changes billing. Run Vite preview on 4173 first.
// QA_AUDIT=1 shows a returning account; default is a new free account.
import { createServer } from 'node:http';

const returning = process.env.QA_AUDIT === '1';
const port = Number(process.env.QA_PORT || 4184);
const audit = { id: 1, url: 'https://example.com/', geoScore: 54, createdAt: '2026-09-04T12:00:00Z', recommendations: [{ id: 'evidence', title: 'Add a documented example', detail: 'Show a real example of your work.', priority: 'high' }] };
const fixtures = {
  '/api/auth/me': { id: 'local-test', email: 'tester@example.com', firstName: 'Test', plan: 'free', emailVerified: true },
  '/api/me': { userId: 'local-test', plan: 'pro', storedPlan: 'free', trial: { active: true, endsAt: '2026-10-04T12:00:00Z' } },
  '/api/admin/me': { isAdmin: false },
  '/api/geo/audits': returning ? [audit] : [],
  '/api/geo/audits/1': audit,
  '/api/geo/monitored-sites': { sites: [] },
  '/api/geo/recommendation-progress': { completed: [] },
};

createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    const data = req.method === 'GET' ? fixtures[pathname] : undefined;
    res.statusCode = data ? 200 : 503;
    res.end(JSON.stringify(data ?? { error: 'Local preview: this action is not connected. No changes were made.' }));
    return;
  }
  try {
    const response = await fetch(`http://127.0.0.1:4173${req.url}`);
    res.statusCode = response.status;
    res.setHeader('Content-Type', response.headers.get('content-type') || 'text/html');
    res.setHeader('Cache-Control', 'no-store');
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.statusCode = 502;
    res.end('Start Vite preview on port 4173 first.');
  }
}).listen(port, '127.0.0.1', () => console.log(`Local fixture dashboard: http://localhost:${port}`));
