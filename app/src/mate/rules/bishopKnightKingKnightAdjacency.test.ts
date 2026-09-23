import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove} from './bishopKnight';

test('r17.5 prefers edge or diagonal king-knight adjacency after either piece moves, across D4', () => {
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r17.5')!;
  const ids = knightAndBishopWhiteRules.map(rule => rule.id);
  assert.ok(ids.indexOf('r17') < ids.indexOf('r17.5') && ids.indexOf('r17.5') < ids.indexOf('r18'));
  for (const transform of SQUARE_TRANSFORMS) {
    for (const whiteKing of ['e1', 'f1'] as const) {
      const board = getChess('B7/8/8/8/3k4/8/8/3NK3 w - - 0 1');
      board.remove('e1'); board.put({type:'k',color:'w'}, whiteKing);
      const fen = transformFen(board.fen(), transform);
      const score = (to: 'f2' | 'b2') => scoreKnightAndBishopWhiteMove(fen,
        getChess(fen).move({from:transformSquare('d1',transform),to:transformSquare(to,transform)}).san);
      assert.equal(score('f2').knightProtectionPenalty, 0);
      assert.equal(score('b2').knightProtectionPenalty, 1);
      assert.ok(rule.compare(score('f2'),score('b2')) < 0);
    }
    const fen = transformFen('B7/8/8/8/3k4/8/8/3NK3 w - - 0 1', transform);
    const move = getChess(fen).move({from:transformSquare('e1',transform),to:transformSquare('d2',transform)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen,move).knightProtectionPenalty, 0);
  }
});
