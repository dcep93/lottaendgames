import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { supportedReport } from './supported-report.mts';

test('supported reports use supported starts as denominator and continue past support', () => {
  const text = supportedReport({ counts: {
    legal: 100, supported: 20, unsupported: 80, directOnAnyDiscoveredLoop: 2,
    canLoop: 5, noLoop: 15, canMate: 12, canFail: 7,
  }, graph: { cyclicFamilies: 1, nodes: 40, edges: 42 }, families: [] }, { commit: 'test', fingerprint: 'test' });
  assert.match(text, /Directly on a loop \| 2 \| 10\.0000%/);
  assert.match(text, /Can reach a loop \| 5 \| 25\.0000%/);
  assert.match(text, /Continue through supported and unsupported positions/);
});

test('an audit with no cycles writes a report and a null display loop', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bn-zero-loop-report-'));
  try {
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ commit: 'test', fingerprint: 'test' }));
    writeFileSync(join(dir, 'result.json'), JSON.stringify({
      counts: { legal: 10, unsupported: 8, supported: 2, canLoop: 0, noLoop: 8,
        directOnAnyDiscoveredLoop: 0, directOnReachableLoop: 0, onlyLoopOutcomes: 0,
        loopAndSupport: 0, canReachSupport: 8, canMate: 0, canFail: 0 },
      graph: { cyclicFamilies: 0, nodes: 10, edges: 8 },
      families: [], archetypes: [], mechanisms: [],
    }));
    execFileSync(process.execPath, ['--import', 'tsx', new URL('./report.mts', import.meta.url).pathname], {
      env: { ...process.env, AUDIT_DIR: dir, AUDIT_COMPARE: '' },
    });
    assert.equal(JSON.parse(readFileSync(join(dir, 'display-loop.json'), 'utf8')), null);
    assert.match(readFileSync(join(dir, 'report.md'), 'utf8'), /Can reach an unsupported loop \| 0 \| 0\.0000%/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
