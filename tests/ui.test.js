import test from 'node:test';
import assert from 'node:assert/strict';

import { escapeHtml, formatDateShort, formatPercentage } from '../js/ui.js';

test('escapes user text before inserting it into an HTML template', () => {
  assert.equal(escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('formats a local date in Brazilian short format', () => {
  assert.equal(formatDateShort(new Date(2026, 7, 17, 12, 0, 0)), '17/08/2026');
});

test('formats percentages consistently', () => {
  assert.equal(formatPercentage(50), '50%');
  assert.equal(formatPercentage(0), '0%');
});
