import assert from 'node:assert/strict';
import test from 'node:test';
import {piecePositionMotif} from './position-motifs.mts';
import {code} from './encoding.mts';
import {SQUARE_TRANSFORMS, transformFen, findPiece} from '../../app/src/mate/chess.ts';
import {knightAndBishopKnightTargetSquares} from '../../app/src/mate/rules/bishopKnightStrategy.ts';

test('audit precage labels match production on either side of the bishop across D4', () => {
  for (const original of [
    '8/8/8/3BK3/2N5/2k5/8/8 w - - 0 1',
    '8/8/4N3/3BK3/8/2k5/8/8 w - - 0 1',
    '8/8/8/3BK3/3N4/2k5/8/8 w - - 0 1',
    '8/8/8/3BK3/8/2kN4/8/8 w - - 0 1',
    '8/8/8/3BKN2/8/2k5/8/8 w - - 0 1',
  ]) for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(original, t);
    const expected = knightAndBishopKnightTargetSquares(fen).includes(findPiece(fen, 'w', 'n')!.square);
    assert.equal(piecePositionMotif(code(fen)).endsWith('knight on precage'), expected, fen);
  }
});

test('loop archetypes describe geometry and are D4 invariant', async () => {
  const {loopPositionMotif} = await import('./position-motifs.mts');
  const original = '8/8/8/2NBk3/2K5/8/8/8 w - - 0 1';
  const expected = 'central bishop; bishop king-protected; knight king-protected; knight orthogonally adjacent to bishop';
  for (const t of SQUARE_TRANSFORMS) assert.equal(loopPositionMotif(code(transformFen(original,t))), expected);
});
