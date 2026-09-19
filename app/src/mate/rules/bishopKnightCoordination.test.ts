import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { bishopKnightRuleSet, getIdealKnightAndBishopWhiteMoves, getKnightAndBishopOpponentCandidates, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';
import { knightAndBishopShouldCoordinateKing } from './bishopKnightCoordination';
import { knightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport';
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
  assert.ok(ids.indexOf('r6') < ids.indexOf('r8'));
  assert.ok(ids.indexOf('r8') < ids.indexOf('r9.5'));
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

test('the old dominant loop has a best-move path into a supported diagonal', () => {
  const board = getChess('8/8/8/4kN2/4B3/5K2/8/8 w - - 0 1');
  const turns: string[] = [];
  for (const san of ['Ng3', 'Kd4', 'Kf4', 'Kc5', 'Ke5', 'Kc4', 'Nf5', 'Kc5', 'Bd5']) {
    if (board.turn() === 'w') {
      assert.ok(getIdealKnightAndBishopWhiteMoves(board.fen()).includes(san), `${board.fen()}: ${san}`);
      turns.push(board.fen());
    } else {
      assert.deepEqual(getKnightAndBishopOpponentCandidates(board.fen(), turns.at(-2)).idealMoves, [san]);
    }
    board.move(san);
  }
  assert.notEqual(knightAndBishopSupportedDiagonal(board.fen()).size, 99);
});
