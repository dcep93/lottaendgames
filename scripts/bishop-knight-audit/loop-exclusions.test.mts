import assert from 'node:assert/strict';
import test from 'node:test';
import {SQUARE_TRANSFORMS, transformFen} from '../../app/src/mate/chess.ts';
import {loopExclusion, loopSearchExclusion, deferredKnightOppositionCycle, deferredCompleteR4Loop} from './loop-exclusions.mts';

for (const [placement, reason] of [
  ['K7/8/8/8/Bk6/2N5/8/8', 'degenerate-a'],
  ['2B3K1/2k5/1N6/8/8/8/8/8', 'degenerate-a'],
  ['8/8/K7/8/8/kN6/B7/8', 'degenerate-b'],
  ['8/8/K7/8/8/8/Bk6/N7', 'degenerate-c'],
  ['8/8/K7/8/8/8/Bk6/2N5', 'degenerate-a'],
] as const) test(`${reason}: ${placement}, both turns and D4`, () => {
  for (const t of SQUARE_TRANSFORMS) for (const side of ['w', 'b']) {
    const fen = transformFen(`${placement} ${side} - - 0 1`, t);
    assert.equal(loopExclusion(fen), reason, fen);
  }
});

test('r4 deferral requires the whole loop, not a complete individual position, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) for (const side of ['w', 'b']) {
    const complete = transformFen(`k7/8/8/3BN3/3K4/8/8/8 ${side} - - 0 1`, t);
    assert.equal(loopSearchExclusion(complete), null);
    assert.equal(deferredCompleteR4Loop([complete, complete]), true);
    assert.equal(deferredCompleteR4Loop([]), false);
    assert.equal(loopExclusion(complete), null);
    for (const board of ['k7/8/8/3BK3/2N5/8/8/8', 'k7/8/8/3BK3/4N3/8/8/8', 'k7/8/8/4N3/3K4/8/B7/8']) {
      const partial = transformFen(`${board} ${side} - - 0 1`, t);
      assert.equal(loopSearchExclusion(partial), null);
      assert.equal(deferredCompleteR4Loop([complete, partial]), false);
      assert.equal(deferredCompleteR4Loop([partial, complete]), false);
    }
  }
});

test('a current or legal next king defense rescues both pieces', () => {
  assert.equal(loopExclusion('8/8/1kB5/2N5/4K3/8/8/8 w - - 0 1'), null);
  assert.equal(loopExclusion('8/8/1kB5/2NK4/8/8/8/8 w - - 0 1'), null);
});


test('knight-check opposition alternation is deferred in either phase and every D4 orientation', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const phases = ['2B5/8/8/8/8/2k5/1N6/2K5 w - - 0 1', '2B5/8/8/8/8/3k4/8/2KN4 w - - 0 1'].map(f => transformFen(f, t));
    assert.equal(deferredKnightOppositionCycle(phases, ['Nd1+', 'Nb2+']), true);
    assert.equal(deferredKnightOppositionCycle([...phases].reverse(), ['Nb2+', 'Nd1+']), true);
    assert.equal(deferredKnightOppositionCycle(phases, ['Nd1', 'Nb2+']), false);
    assert.equal(deferredKnightOppositionCycle(phases, ['Bd1+', 'Nb2+']), false);
    assert.equal(deferredKnightOppositionCycle([phases[0]!, phases[0]!], ['Nd1+', 'Nb2+']), false);
  }
});
