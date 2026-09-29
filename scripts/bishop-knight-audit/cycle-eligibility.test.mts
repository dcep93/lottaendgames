import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {canonical, code} from './encoding.mts';
import {cyclePositionExcluder} from './cycle-eligibility.mts';
import {SQUARE_TRANSFORMS, transformFen} from '../../app/src/mate/chess.ts';

test('winning-only eligibility is side-to-move aware, D4 invariant, and fails on missing probes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bn-winning-filter-'));
  try {
    const fen = '8/8/K7/8/8/kN6/B7/8 w - - 0 1';
    const key = canonical(code(fen));
    writeFileSync(dir + '/result.json', JSON.stringify({tablebaseFilter: 'white-forced-win'}));
    // Fixture deliberately overrides the geometric label: tablebase results alone
    // must decide eligibility; no hidden degenerate filter may run here.
    writeFileSync(dir + '/tablebase-probes.json', JSON.stringify({results: {
      [key * 2]: {whiteWins: true}, [key * 2 + 1]: {whiteWins: false},
    }}));
    const excluded = cyclePositionExcluder(dir);
    for (const t of SQUARE_TRANSFORMS) {
      assert.equal(excluded(transformFen(fen, t)), false);
      assert.equal(excluded(transformFen(fen.replace(' w ', ' b '), t)), true);
    }
    assert.throws(() => excluded('8/8/8/4N3/3KBk2/8/8/8 w - - 0 1'), /Missing eligibility probe/);
  } finally { rmSync(dir, {recursive: true, force: true}); }
});
