import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {bishopKnightRuleSet, getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {sevenCageFormationMoves} from './bishopKnightSevenCage';
import {selectIdealMoves} from './selection';
import {isBoardEdge} from './bishopKnightGeometry';

test('r2 discourages the loaded Kh4 even outside a cage and permits explicit overrides across D4', () => {
  const r2 = bishopKnightRuleSet.whiteRules.find(rule => rule.id === 'r2')!;
  const board = getChess('8/8/8/4N3/3KB3/8/8/6k1 w - - 0 1');
  for (const san of 'Nc4 Kf2 Ke5 Kg3 Kf5 Kh4 Bd3 Kg3 Kg5 Kf3 Bf5 Kg3 Bg4 Kh2'.split(' ')) board.move(san);
  const recovery = board.fen();
  board.remove('c4'); board.put({type:'n',color:'w'},'d4');
  for (const source of [recovery, board.fen()]) for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(source,transform);
    // The original position now invokes diagonal recovery. Nd4 has no cage post.
    if (source !== recovery) assert.deepEqual(sevenCageFormationMoves(fen), []);
    const edge = getChess(fen).move({from:transformSquare('g5',transform),to:transformSquare('h4',transform)});
    const inland = getChess(fen).move({from:transformSquare('g5',transform),to:transformSquare('f4',transform)});
    const edgeScore = scoreKnightAndBishopWhiteMove(fen,edge.san);
    const inlandScore = scoreKnightAndBishopWhiteMove(fen,inland.san);
    assert.ok(r2.compare!(edgeScore,inlandScore) > 0);
    // An explicit r2 preference remains stronger than its default edge preference.
    assert.ok(r2.compare!({...edgeScore,sevenCagePenalty:0},{...inlandScore,sevenCagePenalty:1}) < 0);
    for (const san of getIdealKnightAndBishopWhiteMoves(fen)) {
      const move = getChess(fen).move(san);
      assert.ok(move.piece !== 'k' || !isBoardEdge(move.to));
    }
  }
});

test('king off edge is not a global rule and r1 may choose an edge king move across D4', () => {
  assert.ok(!bishopKnightRuleSet.whiteRules.some(rule => rule.id === 'king off edge'));
  assert.equal(bishopKnightRuleSet.whiteRules[0]!.id, 'mate');
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/8/B7/8/6Nk/4K3 w - - 0 1',transform);
    const move = getChess(fen).move({from: transformSquare('e1',transform),to: transformSquare('f1',transform)});
    assert.ok(isBoardEdge(move.to));
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move.san]);
    const candidates = bishopKnightRuleSet.scoreWhiteCandidates!(fen,getChess(fen).moves());
    assert.deepEqual([...selectIdealMoves(candidates,bishopKnightRuleSet.whiteRules)], [move.san]);
  }
});

test('r2 general cage preference favors inland moves', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/6K1/8/2N1B2k/8/8/8 w - - 0 1',transform);
    const uci = transformSquare('g6',transform) + transformSquare('h6',transform);
    const cage = sevenCageFormationMoves(fen);
    assert.ok(cage.length);
    assert.ok(!cage.includes(uci));
    const preferred = getIdealKnightAndBishopWhiteMoves(fen);
    for (const san of preferred) {
      const move = getChess(fen).move(san);
      assert.ok(cage.includes(move.from+move.to));
      assert.notEqual(move.piece,'n');
    }
  }
});
