import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { knightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight'

test('the former special arrangement keeps d5 as the five-diagonal support square', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('1k6/3B4/1K6/3N4/8/8/8/8 w - - 0 1', transform)
    const afterWhite = transformFen('1k6/3B4/1K6/3N4/8/8/8/8 b - - 0 1', transform)
    assert.deepEqual(knightAndBishopSupportedDiagonal(afterWhite), {size: 5, knight: 0})
    const nf6 = getChess(fen).move({from: transformSquare('d5', transform), to: transformSquare('f6', transform)}).san
    // Nf6 leaves the five-square and cannot reach a seven-square in one move.
    assert.equal(scoreKnightAndBishopWhiteMove(fen, nf6).supportedDiagonalSizeScore, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, nf6).supportedDiagonalKnightScore, 99)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(nf6))
    const entry = transformFen('3K4/k7/8/1B1N4/8/8/8/8 w - - 2 2', transform)
    const after = getChess(entry)
    const san = after.move({from: transformSquare('d8', transform), to: transformSquare('c7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(entry, san).supportedDiagonalKnightScore, 0)
    assert.deepEqual(knightAndBishopSupportedDiagonal(after.fen()), {size: 5, knight: 0})
  }
})
