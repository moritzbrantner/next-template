const test = require('node:test');
const assert = require('node:assert/strict');

test('desktop dummy integration test', () => {
  assert.deepEqual(['desktop', 'integration'], ['desktop', 'integration']);
});
