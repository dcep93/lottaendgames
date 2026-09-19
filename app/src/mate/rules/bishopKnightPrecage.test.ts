import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { knightAndBishopKnightTargetSquares } from './bishopKnightStrategy'

test('precage targets stay behind Be4 against Ke5 and Kd6, in every reflection', () => {
  const line = getChess('8/8/8/4k3/4B3/4K3/4N3/8 w - - 0 1')
  const positions = [line.fen()]
  line.move('Nd4')
  line.move('Kd6')
  positions.push(line.fen())
  for (const position of positions) for (const transform of SQUARE_TRANSFORMS) {
    assert.deepEqual(knightAndBishopKnightTargetSquares(transformFen(position, transform)), [transformSquare('d3', transform)])
  }
})

test('a perpendicular diagonal neighbor is not strictly behind the bishop', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/7k/8/3KB3/8/2N5/8/8 w - - 0 1', transform)
    // Be5's d6/f4 candidates are perpendicular to the e5–h8 direction.
    const board = getChess(fen)
    board.remove(transformSquare('h7', transform))
    board.put({type: 'k', color: 'b'}, transformSquare('h8', transform))
    assert.deepEqual(knightAndBishopKnightTargetSquares(board.fen()), [])
  }
})
