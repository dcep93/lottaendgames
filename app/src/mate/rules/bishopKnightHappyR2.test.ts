// Historical declaration tests. Current stage behavior is exhaustively checked in bishopKnightStages.test.ts.
import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {getIdealKnightAndBishopWhiteMoves as preferred} from '../../../../scripts/bishop-knight-audit/historical-policy.mts';
import {happyR2Moves} from './bishopKnightHappyR2';
import {sevenCageMoves,sevenCageHeuristicMoves,sevenCageFallbackMoves} from './bishopKnightSevenCage';
import {verifyHappyR2} from '../../../../scripts/bishop-knight-audit/verify-happy-r2.mts';

test('verified progress preserves Bf5 and restores Kf3 across D4', () => {
  for(const [source,san] of [
    ['8/8/5K2/8/2N1Bk2/8/8/8 w - - 0 1','Bf5'],
    ['8/8/8/8/2N1B3/4K3/8/5k2 w - - 0 1','Kf3'],
  ]) {
    const move=getChess(source!).move(san!);
    for(const transform of SQUARE_TRANSFORMS){
      const sourceReflected=transformFen(source!,transform);
      const expected=getChess(sourceReflected).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(preferred(sourceReflected),[expected.san]);
      assert.ok(happyR2Moves(sourceReflected).includes(expected.from+expected.to));
    }
  }
});

test('positions outside the certificate retain the fallback policy', () => {
  const source='8/8/8/8/3k4/3BN3/4K3/8 w - - 0 1';
  assert.deepEqual(happyR2Moves(source),[]);
  assert.deepEqual(sevenCageMoves(source),sevenCageHeuristicMoves(source));
});

test('every far-diagonal satisfied-r4 start and every certified arrival finishes under the actual rules', () => {
  const result=verifyHappyR2(preferred);
  assert.equal(result.starts.length,44);
  assert.equal(result.loops,0);
  assert.ok(result.maxPlies<=99);
  assert.equal(result.symmetryChecks,result.whiteStateOrbits*8);
});

test('seven-diagonal Nd4 and Ne5 repairs match full destinations across D4', () => {
  for(const [source,san,established] of [
    ['8/8/2N3k1/3BK3/8/8/8/8 w - - 6 4','Nd4'],
    ['8/8/2N5/3B1K2/7k/8/8/8 w - - 6 4','Ne5'],
    ['8/8/2N5/3B4/8/5K2/7k/8 w - - 6 4','Ne5'],
    // Reach the same full arrivals by moving the king instead of the knight.
    ['8/8/6k1/3B4/3NK3/8/8/8 w - - 0 1','Ke5'],
    // This alternate source already has the established Kf4 handoff: keep it.
    ['8/8/8/3BN3/4K2k/8/8/8 w - - 0 1','Kf5','Kf4'],
  ]) {
    const move=getChess(source!).move(san!);
    for(const transform of SQUARE_TRANSFORMS){
      const reflected=transformFen(source!,transform);
      const expected=getChess(reflected).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.deepEqual(sevenCageFallbackMoves(reflected),[expected.from+expected.to]);
      const selected=getChess(source!).move(established??san!);
      const selectedReflected=getChess(reflected).move({from:transformSquare(selected.from,transform),to:transformSquare(selected.to,transform)});
      assert.deepEqual(sevenCageMoves(reflected),[selectedReflected.from+selectedReflected.to]);
      assert.deepEqual(preferred(reflected),[selectedReflected.san]);
    }
  }
});

test('historical Nd3 branch retains Ke3 Kf4 continuations across D4', () => {
  const board=getChess('8/8/5k2/3BN3/3K4/8/8/8 w - - 0 1');
  for(const san of ['Nd3','Kf5','Ke3','Kf6','Kf4','Ke7']) {
    const source=board.fen(),move=board.move(san);
    if(move.color!=='w'||san==='Nd3')continue;
    for(const transform of SQUARE_TRANSFORMS){
      const reflected=transformFen(source,transform);
      const expected=getChess(reflected).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
      assert.ok(sevenCageMoves(reflected).includes(expected.from+expected.to));
      assert.deepEqual(preferred(reflected),[expected.san]);
    }
  }
});


test('revised main-diagonal entry selects Be4 instead of Nd3 across D4', () => {
  const source='8/8/5k2/3BN3/3K4/8/8/8 w - - 0 1';
  const move=getChess(source).move('Be4');
  for(const transform of SQUARE_TRANSFORMS){
    const reflected=transformFen(source,transform);
    const expected=getChess(reflected).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
    assert.deepEqual(sevenCageMoves(reflected),[expected.from+expected.to]);
    assert.deepEqual(preferred(reflected),[expected.san]);
  }
});

test('main-diagonal Kd5 after Nf3 Kf6 receives r2 preference across D4', () => {
  const source='8/8/5k2/8/3KB3/5N2/8/8 w - - 4 3';
  const move=getChess(source).move('Kd5');
  for(const transform of SQUARE_TRANSFORMS){
    const reflected=transformFen(source,transform);
    const expected=getChess(reflected).move({from:transformSquare(move.from,transform),to:transformSquare(move.to,transform)});
    assert.ok(sevenCageMoves(reflected).includes(expected.from+expected.to));
    assert.deepEqual(preferred(reflected),[expected.san]);
  }
});
