const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('mobile has explicit light and dark theme controls', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../components/theme-mode-toggle.tsx'),
    'utf8',
  );

  assert.match(source, /Light/);
  assert.match(source, /Dark/);
  assert.match(source, /setThemeMode\('light'\)/);
  assert.match(source, /setThemeMode\('dark'\)/);
});
