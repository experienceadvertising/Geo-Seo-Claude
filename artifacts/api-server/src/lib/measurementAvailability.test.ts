import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observedRobotsText, requireSuccessfulSample } from './measurementAvailability.ts';
test('unavailable robots observations never become permission to crawl', () => {
  assert.throws(() => observedRobotsText(503, 'text/plain', 'error'));
  assert.throws(() => observedRobotsText(200, 'text/html', '<html>app</html>'));
  assert.throws(() => observedRobotsText(200, 'text/plain', '<!doctype html><html>app</html>'));
  assert.equal(observedRobotsText(404, 'text/html', 'not found'), '');
  assert.equal(observedRobotsText(200, 'text/plain', 'User-agent: *\nDisallow: /'), 'User-agent: *\nDisallow: /');
});
test('provider failure is unavailable, while successful no-mention answers remain valid observations', () => {
  assert.throws(() => requireSuccessfulSample([{ engines: [{ error: 'timeout' }] }]));
  assert.throws(() => requireSuccessfulSample([]));
  assert.doesNotThrow(() => requireSuccessfulSample([{ engines: [{ error: 'timeout' }, { error: null }] }]));
});
