import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { knightAndBishopKnightTargetSquares, knightAndBishopPrecageApproachSquares } from './bishopKnightStrategy'
import { getIdealKnightAndBishopWhiteMoves } from './bishopKnight'

test('precage squares depend on central bishop geometry, not Black king direction, across D4', () => {
 for (const t of SQUARE_TRANSFORMS) {
  for (const f of ['8/8/8/4k3/4B3/4K3/4N3/8 w - - 0 1',
    '8/8/3k4/8/4B3/4K3/4N3/8 w - - 0 1']) {
   assert.deepEqual(new Set(knightAndBishopKnightTargetSquares(transformFen(f,t))),
    new Set(['d3','f5'].map(s=>transformSquare(s as 'd3'|'f5',t))))
  }
 }
})

test('Nc4 is preferred immediately beside Bd5 in the loaded position across D4', () => {
 for (const t of SQUARE_TRANSFORMS) {
  const f=transformFen('8/8/8/3BK3/8/2k5/1N6/8 w - - 0 1',t)
  assert.deepEqual(new Set(knightAndBishopKnightTargetSquares(f)),
   new Set(['c4','e6'].map(s=>transformSquare(s as 'c4'|'e6',t))))
  const m=getChess(f).move({from:transformSquare('b2',t),to:transformSquare('c4',t)}).san
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(f),[m])
 }
})


test('r9.99 alone expands approach targets to both same-color central setups across D4', () => {
 for (const t of SQUARE_TRANSFORMS) {
  const fen=transformFen('8/8/4N1k1/3BK3/8/8/8/8 w - - 0 1',t)
  assert.deepEqual(new Set(knightAndBishopPrecageApproachSquares(fen)),
   new Set((['c4','d3','e6','f5'] as const).map(s=>transformSquare(s,t))))
  assert.deepEqual(new Set(knightAndBishopKnightTargetSquares(fen)),
   new Set((['c4','e6'] as const).map(s=>transformSquare(s,t))))
 }
})
