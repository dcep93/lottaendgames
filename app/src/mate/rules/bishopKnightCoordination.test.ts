import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { bishopKnightRuleSet, getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';
import { knightAndBishopShouldCoordinateKing } from './bishopKnightCoordination';
import { selectCandidatesByRules } from './selection';
import { getMateRuleSet } from './index';

const position = '8/8/8/8/3kB3/5KN1/8/8 w - - 2 2';

test('r8 selects Kf4 before the changing precage target in every symmetry', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position, transform);
    const move = getChess(fen).move({ from: transformSquare('f3', transform), to: transformSquare('f4', transform) }).san;
    assert.ok(knightAndBishopShouldCoordinateKing(fen));
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move]);
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r8');
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).kingCoordinationPenalty, 0);
  }
  const ids = knightAndBishopWhiteRules.map(rule => rule.id);
  assert.ok(ids.indexOf('r5') < ids.indexOf('r8'));
  assert.ok(ids.indexOf('r8') < ids.indexOf('r10'));
});

test('r8 does not broaden its trigger to different adjacency arrangements', () => {
  const arrangements = [
    ['e4', 'e3'], // Noncentral bishop.
    ['d4', 'd5'], // Black diagonal-adjacent, not edge-adjacent.
    ['f3', 'f4'], // White edge-adjacent, not diagonal-adjacent.
    ['g3', 'g2'], // Knight diagonal-adjacent to White.
    ['g3', 'e3'], // Knight adjacent to the bishop.
  ] as const;
  for (const [from, to] of arrangements) {
    const board = getChess(position);
    const piece = board.remove(from)!;
    board.put(piece, to);
    assert.equal(knightAndBishopShouldCoordinateKing(board.fen()), false, `${from}-${to}`);
  }
  const inactive = '8/8/8/8/3kBK2/6N1/8/8 w - - 0 1';
  for (const san of getChess(inactive).moves()) assert.equal(scoreKnightAndBishopWhiteMove(inactive, san).kingCoordinationPenalty, 0);
});

test('r8 is neutral when the arrangement has no qualifying legal king move', () => {
  const board = getChess(position);
  board.remove('g3');
  board.put({ type: 'n', color: 'w' }, 'f2');
  const fen = board.fen();
  assert.ok(knightAndBishopShouldCoordinateKing(fen));
  const candidates = bishopKnightRuleSet.scoreWhiteCandidates!(fen, board.moves());
  assert.ok(candidates.every(candidate => candidate.score.kingCoordinationPenalty === 1));
  assert.deepEqual(
    getIdealKnightAndBishopWhiteMoves(fen),
    selectCandidatesByRules(candidates, knightAndBishopWhiteRules.filter(rule => rule.id !== 'r8')).idealCandidates.map(candidate => candidate.san),
  );
});
