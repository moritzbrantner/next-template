import test from 'node:test';
import assert from 'node:assert/strict';

test('web dummy integration test', () => {
  assert.deepEqual(['web', 'integration'], ['web', 'integration']);
});
