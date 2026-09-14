import assert from 'node:assert/strict'
import test from 'node:test'
import type { Square } from 'chess.js'
import { boardFenFromPlacements, getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getIdealKnightAndBishopWhiteMoves, getMateRuleSet } from './index'
import { getKnightAndBishopPreparationMoves } from './bishopKnightSolidify'
import example from './bishopKnightSolidifyExample.json'

function position(bishop: Square, white: Square = 'f6', black: Square = 'g8', knight: Square = 'f7') {
  return `${boardFenFromPlacements([
    {isPawn: false, color: 'w', type: 'b', square: bishop}, {isPawn: false, color: 'w', type: 'k', square: white},
    {isPawn: false, color: 'b', type: 'k', square: black}, {isPawn: false, color: 'w', type: 'n', square: knight},
  ])} w - - 0 1`
}

test('r3.8 prepares opposition in every orientation for every x-ray bishop placement', () => {
  for (const bishop of ['a2', 'b3', 'c4', 'd5', 'e6'] as const) {
    for (const transform of SQUARE_TRANSFORMS) {
      const chess = getChess(transformFen(position(bishop), transform))
      for (const step of example.moves) {
        const fen = chess.fen()
        const move = chess.move({from: transformSquare(step.from as Square, transform), to: transformSquare(step.to as Square, transform)})
        if (move.color !== 'w') continue
        assert.deepEqual(getKnightAndBishopPreparationMoves(fen), [move.san], fen)
        assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move.san], fen)
        assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r3.8', fen)
      }
    }
  }
})

test('r3.8 requires the x-ray formation and a legal opposition step', () => {
  for (const fen of [
    position('d5', 'e6'), // White blocks the bishop's x-ray.
    position('c5'), // Bishop does not x-ray Black through the knight.
    position('d5', 'f6', 'h8'), // Black is in the corner.
    position('d5', 'f6', 'g8', 'e8'), // Knight is on the edge.
    position('d5', 'a1'), // Opposition cannot be reached this move.
    position('d5').replace(' w ', ' b '),
    position('d5', 'g6', 'a8', 'e5'), // Unrelated midway arrangement.
  ]) assert.deepEqual(getKnightAndBishopPreparationMoves(fen), [], fen)
  assert.deepEqual(getKnightAndBishopPreparationMoves(position('d5', 'g6')), [])
})

test('r3.8 GIF shows only preparation and Black’s reply', () => {
  const chess = getChess(example.fen)
  assert.deepEqual(example.highlightedDiagonal, ['a2', 'b3', 'c4', 'd5', 'e6', 'f7', 'g8'])
  for (const move of example.moves) {
    assert.equal(chess.move({from: move.from, to: move.to}).san, move.san)
  }
  assert.equal(chess.fen(), '5k2/5N2/6K1/3B4/8/8/8/8 w - - 2 2')
})
