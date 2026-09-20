import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARES } from 'chess.js'
import { getChess, squareCoords, squareColor, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { bishopLongDiagonalIntersection } from './bishopKnightGeometry'
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight'

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

test('r15 compares resulting intersection distances and follows r10', () => {
  assert.equal(knightAndBishopWhiteRules.at(-2)!.id, 'r10')
  assert.equal(knightAndBishopWhiteRules.at(-1)!.id, 'r15')
  const fen = '8/8/3k4/8/B2K4/2N5/8/8 w - - 2 2'
  assert.equal(scoreKnightAndBishopWhiteMove(fen, 'Nd1').bishopLongDiagonalIntersectionScore, -1)
  assert.equal(scoreKnightAndBishopWhiteMove(fen, 'Bc2').bishopLongDiagonalIntersectionScore, -Math.sqrt(5))
  assert.equal(scoreKnightAndBishopWhiteMove(fen, 'Bd1').bishopLongDiagonalIntersectionScore, -Math.sqrt(13))
  // A bishop already on its long diagonal contributes no r15 distance.
  assert.equal(scoreKnightAndBishopWhiteMove('7k/8/8/8/3K4/8/1B6/N7 w - - 0 1', 'Bc3').bishopLongDiagonalIntersectionScore, 0)
})


test('r15 selects Bd1 over Bc2 in the loaded position and every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/3k4/8/B2K4/2N5/8/8 w - - 2 2', transform)
    const move = getChess(fen).move({from: transformSquare('a4', transform), to: transformSquare('d1', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
  }
})
