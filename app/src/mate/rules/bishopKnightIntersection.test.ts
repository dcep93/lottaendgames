import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARES } from 'chess.js'
import { squareCoords, squareColor, SQUARE_TRANSFORMS, transformSquare } from '../chess'
import { bishopLongDiagonalIntersection } from './bishopKnightGeometry'

test('every bishop intersection is on its same-color long diagonal and preserves board symmetries', () => {
  for (const square of SQUARES) {
    const intersection = bishopLongDiagonalIntersection(square)
    const from = squareCoords(square)
    const to = squareCoords(intersection)
    assert.equal(squareColor(square), squareColor(intersection))
    assert.ok(to.file === to.rank || to.file + to.rank === 7)
    assert.equal(Math.abs(from.file - to.file), Math.abs(from.rank - to.rank))
    for (const transform of SQUARE_TRANSFORMS) {
      assert.equal(bishopLongDiagonalIntersection(transformSquare(square, transform)), transformSquare(intersection, transform))
    }
  }
  assert.equal(bishopLongDiagonalIntersection('a4'), 'c6')
  assert.equal(bishopLongDiagonalIntersection('c2'), 'e4')
  assert.equal(bishopLongDiagonalIntersection('d1'), 'f3')
})
