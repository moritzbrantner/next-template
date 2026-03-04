import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('web theme toggle persists a selected mode', () => {
  const source = readFileSync(new URL('../app/theme-toggle.tsx', import.meta.url), 'utf8');

  assert.match(source, /localStorage\.setItem\(STORAGE_KEY, theme\)/);
  assert.match(source, /Switch to dark mode/);
  assert.match(source, /Switch to light mode/);
});
