import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen} from '../chess';
import {knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove} from './bishopKnight';

test('r7 is neutral for every legal move, including the former edge trap, across D4', () => {
  const r7 = knightAndBishopWhiteRules.find(rule => rule.id === 'r7')!;
  const r6 = knightAndBishopWhiteRules.find(rule => rule.id === 'r6')!;
  assert.equal(r6.applies, undefined);
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('6B1/5K2/N2k4/8/8/8/8/8 w - - 0 1', t);
    const scores = getChess(fen).moves().map(move => scoreKnightAndBishopWhiteMove(fen, move));
    for (const score of scores) assert.equal(r7.compare!(scores[0]!, score), 0, t.name);
  }
});
