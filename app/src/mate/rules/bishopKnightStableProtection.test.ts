import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, transformFen, transformSquare, getChess } from '../chess'
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { stableBishopProtectedSquares, stableBishopProtectionDistance } from './bishopKnightStableProtection'

test('edge bishops exclude adjacent targets while retaining distant targets across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const f=transformFen('8/1K6/B7/8/8/4k3/8/4N3 w - - 0 1',t)
    const squares=stableBishopProtectedSquares(f)
    assert.ok(!squares.includes(transformSquare('b5',t)))
    assert.ok(squares.includes(transformSquare('d3',t)))
    assert.equal(stableBishopProtectionDistance(f),1)
    const ch=getChess(f);ch.move({from:transformSquare('e1',t),to:transformSquare('d3',t)})
    assert.equal(stableBishopProtectionDistance(ch.fen()),0)
  }
})

test('interior bishops allow adjacent protection even with no free retreat square', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const f=transformFen('K7/1B6/2N5/4k3/8/8/8/8 w - - 0 1',t)
    assert.ok(stableBishopProtectedSquares(f).includes(transformSquare('c6',t)))
    assert.equal(stableBishopProtectionDistance(f),0)
  }
})

test('distance planning sees past the moving knight and Black king but not White king', () => {
  const f='8/6K1/8/8/4k3/3N4/2B5/8 w - - 0 1'
  const targets=stableBishopProtectedSquares(f)
  assert.ok(targets.includes('f5'))
  assert.ok(targets.includes('g6'))
  assert.ok(!targets.includes('e4'))
  const blocked='8/8/8/5K2/4k3/3N4/2B5/8 w - - 0 1'
  assert.ok(!stableBishopProtectedSquares(blocked).includes('g6'))
})

test('stable bishop protection requires Black within two king steps of the knight, across D4', () => {
 for(const t of SQUARE_TRANSFORMS){
  for(const [position,stable] of [
   ['8/8/BK1k4/8/8/8/8/5N2 w - - 0 1',false],
   ['8/8/BK6/8/8/2k5/8/5N2 w - - 0 1',false],
   ['8/8/BK6/8/8/3k4/8/5N2 w - - 0 1',true],
  ] as const){
   const fen=transformFen(position,t);
   assert.equal(stableBishopProtectedSquares(fen).includes(transformSquare('f1',t)),stable,t.name);
  }
 }
});


test('the loaded bishop shuffle yields to Ne3 when Black is far from Nf1, across D4', () => {
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen('8/8/BK1k4/8/8/8/8/5N2 w - - 0 1',t);
  const bishop=getChess(f).move({from:transformSquare('a6',t),to:transformSquare('b5',t)}).san;
  const knight=getChess(f).move({from:transformSquare('f1',t),to:transformSquare('e3',t)}).san;
  const held=scoreKnightAndBishopWhiteMove(f,bishop);
  assert.equal(held.knightStableBishopProtectionPenalty,1,t.name);
  assert.equal(held.unprotectedMinorCount,1,t.name); // Bishop is king-defended; knight is not stably defended.
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(f),[knight],t.name);
 }
});
