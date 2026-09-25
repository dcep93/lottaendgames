import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';
import { compareScoresByRules } from './selection';

test('r7.8 knight adjacency takes priority over r8 bishop centralization across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('B7/8/8/5k2/3K4/8/8/5N2 w - - 0 1', transform);
    const san = getChess(fen).move({from: transformSquare('a8', transform), to: transformSquare('d5', transform)}).san;
    const knightMove = getChess(fen).move({from: transformSquare('f1', transform), to: transformSquare('e3', transform)}).san;
    const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r8')!;
    assert.ok(compareScoresByRules(scoreKnightAndBishopWhiteMove(fen, san), scoreKnightAndBishopWhiteMove(fen, knightMove), [rule]) < 0);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [knightMove], transform.name);
  }
});

test('r8 uses starting middle-16 king placement and advances the knight toward a precage square', () => {
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r8')!;
  for (const transform of SQUARE_TRANSFORMS) {
    const score = (fen: string, from: 'd4' | 'c3' | 'b3' | 'f1', to: 'c3' | 'b3' | 'd4' | 'd2' | 'h2') => {
      const source = transformFen(fen, transform);
      const san = getChess(source).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
      return scoreKnightAndBishopWhiteMove(source, san);
    };
    assert.equal(rule.applies!(score('B7/8/7k/8/3K4/8/8/5N2 w - - 0 1', 'd4', 'c3')), true);
    assert.equal(rule.applies!(score('B7/8/7k/8/8/2K5/8/5N2 w - - 0 1', 'c3', 'd4')), true);
    assert.equal(rule.applies!(score('B7/8/7k/8/8/1K6/8/5N2 w - - 0 1', 'b3', 'c3')), false);
    assert.equal(rule.applies!(score('B7/8/7k/8/8/2K5/8/5N2 w - - 0 1', 'c3', 'b3')), true);
    const fen = '8/8/7k/3B4/3K4/8/8/5N2 w - - 0 1';
    assert.ok(compareScoresByRules(score(fen, 'f1', 'd2'), score(fen, 'f1', 'h2'), [rule]) < 0, transform.name);
  }
});


test('r8 finally prefers the knight off bishop color, only with a starting middle-16 king, across D4', () => {
  const rule=knightAndBishopWhiteRules.find(r=>r.id==='r8')!;
  for(const t of SQUARE_TRANSFORMS){
    const f=transformFen('8/2k5/2B5/8/3K4/2N5/8/8 w - - 2 2',t);
    const san=(from:'c3'|'c6',to:'d5'|'a8')=>getChess(f).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
    const off=scoreKnightAndBishopWhiteMove(f,san('c6','a8'));
    const same=scoreKnightAndBishopWhiteMove(f,san('c3','d5'));
    assert.equal(off.knightBishopColorPenalty,0,t.name);
    assert.equal(same.knightBishopColorPenalty,1,t.name);
    // Isolate the last tie-break after the earlier r8 criteria tie.
    assert.ok(compareScoresByRules(off,same,[rule])<0,t.name);
    assert.equal(compareScoresByRules({...off,startsWithMiddle16King:false},{...same,startsWithMiddle16King:false},[rule]),0,t.name);
  }
});


test('r8 applies to the loaded Kd6 loop in all D4 orientations', () => {
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r8')!;
  for (const t of SQUARE_TRANSFORMS) {
    const f = transformFen('8/8/B2K4/8/4k3/8/8/3N4 w - - 0 1', t);
    const san = getChess(f).move({from: transformSquare('a6', t), to: transformSquare('d3', t)}).san;
    assert.equal(rule.applies!(scoreKnightAndBishopWhiteMove(f, san)), true, t.name);
  }
});
