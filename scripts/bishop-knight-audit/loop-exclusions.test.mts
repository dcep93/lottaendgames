import assert from 'node:assert/strict';
import test from 'node:test';
import {SQUARE_TRANSFORMS, transformFen} from '../../app/src/mate/chess.ts';
import {loopExclusion} from './loop-exclusions.mts';

for (const [placement, reason] of [
  ['K7/8/8/8/Bk6/2N5/8/8', 'degenerate-a'],
  ['2B3K1/2k5/1N6/8/8/8/8/8', 'degenerate-a'],
  ['8/8/K7/8/8/kN6/B7/8', 'degenerate-b'],
  ['8/8/K7/8/8/8/Bk6/N7', 'degenerate-c'],
  ['8/8/K7/8/8/8/Bk6/2N5', 'degenerate-a'],
  ['8/8/8/1k1B4/2NK4/8/8/8', 'central-bishop-adjacent-knight'],
] as const) test(`${reason}: ${placement}, both turns and D4`, () => {
  for (const t of SQUARE_TRANSFORMS) for (const side of ['w', 'b']) {
    const fen = transformFen(`${placement} ${side} - - 0 1`, t);
    assert.equal(loopExclusion(fen), reason, fen);
  }
});

test('central diagonal adjacency is terminal regardless of Black side', () => {
  assert.equal(loopExclusion('8/8/8/3BK3/2N5/2k5/8/8 w - - 0 1'), 'central-bishop-adjacent-knight');
  assert.equal(loopExclusion('8/8/8/3BK3/3N4/2k5/8/8 w - - 0 1'), null);
  assert.equal(loopExclusion('8/8/8/2B1K3/1N6/6k1/8/8 w - - 0 1'), null);
});

test('a current or legal next king defense rescues both pieces', () => {
  assert.equal(loopExclusion('8/8/1kB5/2N5/4K3/8/8/8 w - - 0 1'), null);
  assert.equal(loopExclusion('8/8/1kB5/2NK4/8/8/8/8 w - - 0 1'), null);
});

test('a loop entering the new terminal after White is excluded', async () => {
  const {verifyLoopExample} = await import('./verify-loop-example.mts');
  // Start outside the terminal, but Bd5 puts the bishop next to Nc4.
  assert.equal(verifyLoopExample('8/8/8/8/1kNKB3/8/8/8 w - - 0 1', ['Bd5', 'Kb5', 'Be4', 'Kb4']), false);
});

test('example verifier rejects the fixed drift loop and accepts remaining eligible loops', async () => {
  const {verifyLoopExample} = await import('./verify-loop-example.mts');
  assert.equal(verifyLoopExample("6B1/N7/1k6/8/8/8/K7/8 w - - 0 1", ["Nc8+", "Kc6", "Na7+", "Kb6"]), false);
  assert.equal(verifyLoopExample("B7/8/8/8/8/8/k2K4/3N4 w - - 0 1", ["Bh1", "Kb1", "Ba8", "Ka2"]), false);
  assert.equal(verifyLoopExample("B7/6k1/8/3N4/3K4/8/8/8 w - - 0 1", ["Ke5", "Kg6", "Kd4", "Kg7"]), true);
});
