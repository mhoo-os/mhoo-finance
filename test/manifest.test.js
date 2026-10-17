import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifestPath = new URL('../docs/migration/finance-extraction-manifest.md', import.meta.url);
const rowPattern = /^\| `([^`]+)` \| (\d+) \| `([0-9a-f]{64})` \| \*\*(port|rewrite-vanilla|drop)\*\* \| `([^`]+)` \| PR #(\d+) \|$/;
const sourcePathPattern = /^[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)*$/;
const targetPathPattern = /^(?:[a-zA-Z0-9._-]+)(?:\/[a-zA-Z0-9._-]+)*\/?(?:\s+\(.*\))?$/;

test('every custody manifest row has a well-formed source, target, hash, disposition, and planned PR', async () => {
  const markdown = await readFile(manifestPath, 'utf8');
  const rows = markdown.split('\n').filter((line) => line.startsWith('| `'));
  assert.equal(rows.length, 83);

  for (const row of rows) {
    const match = row.match(rowPattern);
    assert.ok(match, `malformed manifest row: ${row}`);
    const [, source, loc, hash, disposition, target, pr] = match;
    assert.match(source, sourcePathPattern);
    assert.ok(Number(loc) >= 0);
    assert.match(hash, /^[0-9a-f]{64}$/);
    assert.ok(['port', 'rewrite-vanilla', 'drop'].includes(disposition));
    assert.ok(target === '—' || targetPathPattern.test(target), `malformed target: ${target}`);
    assert.ok(Number(pr) >= 1 && Number(pr) <= 7, `unsupported planned PR: ${pr}`);
    if (disposition === 'drop') assert.equal(target, '—');
    if (disposition !== 'drop') assert.notEqual(target, '—');
  }
});
