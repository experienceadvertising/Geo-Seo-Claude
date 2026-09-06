// Local-only UI fixtures. Never connects to production APIs, sends email,
// runs an audit, or changes billing. Completion writes only change in-memory
// fixture data and disappear on restart. Run Vite preview on 4173 first.
// QA_AUDIT=1 shows a returning account; default is a new free account.
import { createServer } from 'node:http';

const returning = process.env.QA_AUDIT === '1';
const paid = process.env.QA_PAID === '1';
const signedOut = process.env.QA_SIGNED_OUT === '1';
const pushConfigured = process.env.QA_PUSH === '1';
const previewOrigin = process.env.QA_PREVIEW_ORIGIN || 'http://127.0.0.1:4173';
const port = Number(process.env.QA_PORT || 4184);
const audit = { id: 1, url: 'https://example.com/', geoScore: 54, createdAt: '2026-09-04T12:00:00Z', recommendations: [{ id: 'direct-answer-block', title: 'Answer a relevant buyer question', detail: 'Help visitors choose the right option.', category: 'structure', priority: 'high' }, { id: 'content-effort-methodology', title: 'Show how the service works', detail: 'Add verified methodology details.', category: 'depth', priority: 'medium' }] };
Object.assign(audit, {
  scores: { citability: 50, brandAuthority: 50, aiCrawlerAccess: 75, technicalSeo: 60, structuredData: 40, platformOptimization: 50 },
  title: 'Analytics Consulting | Example', description: 'We help growth teams find and fix gaps in their analytics.', brandName: 'Example', recommendationsSchemaVersion: 'v1',
  crawlers: [], platforms: [], citabilityBlocks: [], quickWins: [], technicalIssues: [], schemaTypes: [],
  brandSignals: [], aiInsights: null, wordCount: 500, rawHtmlWordCount: 500,
});
const fixtures = {
  '/api/auth/me': { id: 'local-test', email: 'tester@example.com', firstName: 'Test', plan: 'free', emailVerified: true },
  '/api/me': { userId: 'local-test', plan: 'pro', storedPlan: paid ? 'pro' : 'free', trial: { active: !paid, endsAt: '2026-10-04T12:00:00Z' } },
  '/api/admin/me': { isAdmin: false },
  '/api/geo/audits': returning ? [audit] : [],
  '/api/geo/audits/1': audit,
  '/api/geo/monitored-sites': { sites: paid ? [{ id: 1, active: true, lastRunAt: null }] : [] },
  '/api/integrations/google/status': { connected: paid, searchConsoleGranted: paid, propertyId: paid ? 'fixture-property' : null },
  '/api/seo/keywords': { providerConfigured: true, limits: { activeKeywords: 25 }, targets: paid ? [{ id: 1, keyword: 'example service', locationName: 'United States', device: 'desktop', active: true, latest: null }, { id: 2, keyword: 'example agency', locationName: 'United States', device: 'mobile', active: true, latest: { position: 12, result_present: true, collected_at: '2026-08-01' } }] : [] },
  '/api/seo/overview': { limits: { activeKeywords: 25, manualRefreshes: 10 }, usage: { activeKeywords: paid ? 2 : 0, manualRefreshes: 0 } },
  '/api/geo/recommendation-progress': { completed: [] },
  '/api/notifications/status': { configured: pushConfigured, subscribed: false, publicKey: pushConfigured ? 'BCZAdummyPublicVapidKeyForLocalPermissionCheckOnly' : null },
};

if (paid) {
  fixtures['/api/seo/overview'].limits.keywordInsights = 25;
  fixtures['/api/seo/overview'].usage.keywordInsights = 1;
  fixtures['/api/seo/keywords'].targets[1].insights = {
    collectedAt: new Date().toISOString(), sourceUpdatedAt: '2026-08-15', intentUpdatedAt: '2026-07-01', searchVolume: 120, intent: 'commercial',
    monthlySearches: [{year: 2026,month: 6,volume: 90},{year: 2026,month: 7,volume: null},{year: 2026,month: 8,volume: 120}],
  };
  fixtures['/api/seo/keywords'].targets[1].latest.competitors = [{url:'https://competitor.example/',domain:'competitor.example',position:3,title:'Example competitor for local testing'}];
}

createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    if (signedOut) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Local signed-out fixture' }));
      return;
    }
    if (req.method === 'POST' && pathname === '/api/geo/recommendation-progress') {
      let body = '';
      for await (const chunk of req) body += chunk;
      try {
        const action = JSON.parse(body);
        const progress = fixtures[pathname];
        progress.completed = progress.completed.filter(item => item.recommendationId !== action.recommendationId);
        if (action.completed) progress.completed.push({ recommendationId: action.recommendationId, completedAt: new Date().toISOString(), implementationNote: typeof action.implementationNote === 'string' ? action.implementationNote.trim().slice(0, 1000) : null });
        res.end(JSON.stringify({ ok: true }));
      } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'Invalid local fixture action' })); }
      return;
    }
    const data = req.method === 'GET' ? fixtures[pathname] : undefined;
    res.statusCode = data ? 200 : 503;
    res.end(JSON.stringify(data ?? { error: 'Local preview: this action is not connected. No changes were made.' }));
    return;
  }
  try {
    if (pathname.endsWith('.js') && process.env.QA_BLOCK_BUNDLE === '1') {
      res.statusCode = 503;
      res.end('Local bundle-failure fixture');
      return;
    }
    if (pathname.endsWith('.js') && process.env.QA_DELAY_MS) {
      await new Promise(resolve => setTimeout(resolve, Number(process.env.QA_DELAY_MS)));
    }
    const response = await fetch(`${previewOrigin}${req.url}`);
    res.statusCode = response.status;
    res.setHeader('Content-Type', response.headers.get('content-type') || 'text/html');
    res.setHeader('Cache-Control', 'no-store');
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.statusCode = 502;
    res.end('Start Vite preview on port 4173 first.');
  }
}).listen(port, '127.0.0.1', () => console.log(`Local fixture dashboard: http://localhost:${port}`));
