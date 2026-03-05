const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('desktop renderer includes a theme selector with persistence and navbar mounting', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../src/renderer.ts'), 'utf8');

  assert.match(source, /desktop-theme/);
  assert.match(source, /Light mode/);
  assert.match(source, /Dark mode/);
  assert.match(source, /localStorage\.setItem\(storageKey, theme\)/);
  assert.match(source, /app\.prepend\(createNavbar\(\)\)/);
});

test('desktop navbar component provides app navigation links', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../src/navbar.ts'), 'utf8');

  assert.match(source, /navbar__brand/);
  assert.match(source, /Desktop App/);
  assert.match(source, /Home/);
  assert.match(source, /Settings/);
});
