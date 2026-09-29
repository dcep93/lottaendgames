import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canonical, code} from './encoding.mts';
import {loopExclusion} from './loop-exclusions.mts';

/** Preserve the completed audit's eligibility definition in all postprocessors. */
export function cyclePositionExcluder(dir: string): (fen: string) => boolean {
  const result = JSON.parse(readFileSync(dir + '/result.json', 'utf8'));
  if (result.tablebaseFilter !== 'white-forced-win') return fen => loopExclusion(fen) !== null;
  const {results} = JSON.parse(readFileSync(dir + '/tablebase-probes.json', 'utf8'));
  return fen => {
    const key = canonical(code(fen)) * 2 + Number(fen.split(' ')[1] === 'b');
    const probe = results[key];
    assert.ok(probe, `Missing eligibility probe for ${fen}`);
    return !probe.whiteWins;
  };
}
