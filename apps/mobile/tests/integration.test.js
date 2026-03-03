const test = require('node:test');
const assert = require('node:assert/strict');

test('mobile dummy integration test', () => {
  assert.deepEqual(['mobile', 'integration'], ['mobile', 'integration']);
});
