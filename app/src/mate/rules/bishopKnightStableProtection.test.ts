import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, transformFen, transformSquare, getChess } from '../chess'
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
    const f=transformFen('K7/1B6/2N5/8/7k/8/8/8 w - - 0 1',t)
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
