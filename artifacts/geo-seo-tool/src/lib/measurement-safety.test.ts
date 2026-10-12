import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvCell } from './worksheet-csv.ts';
import { publicAuditUrl } from './public-audit-url.ts';
test('worksheet export protects formulas including leading whitespace and quotes', () => {
  for (const value of ['=1+1', ' +SUM(A1)', '\t@SUM(A1)', '-1+2']) assert.ok(csvCell(value).startsWith('"\''));
  assert.equal(csvCell('He said "yes"'), '"He said ""yes"""');
  assert.equal(csvCell('42'), '"42"');
});
test('public audit entry rejects private targets and credentials before signup', () => {
  for (const value of ['http://127.0.0.1', 'http://2130706433', 'http://10.1.1.1', 'http://172.16.1.1', 'http://192.168.1.1', 'http://[::1]', 'http://localhost', 'http://x.local', 'https://user:pass@example.com']) assert.throws(() => publicAuditUrl(value));
  assert.equal(publicAuditUrl('example.com').href, 'https://example.com/');
  assert.equal(publicAuditUrl('https://example.com/article').pathname, '/article');
});
