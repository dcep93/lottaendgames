import assert from 'node:assert/strict'
import test from 'node:test'
import { allSquares, getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { knightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'
import { scoreKnightAndBishopWhiteMove } from './bishopKnight'

test('a knight on the middle three-diagonal square disqualifies even declared king support', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      '8/8/8/8/8/8/5KNk/5B2 b - - 1 1',
      '8/8/8/8/8/7k/5KN1/5B2 b - - 3 2',
      '8/8/8/8/8/5K1B/6Nk/8 b - - 1 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
    const start = transformFen('8/8/B7/8/8/8/5KNk/8 w - - 0 1', transform)
    const san = getChess(start).move({from: transformSquare('a6', transform), to: transformSquare('f1', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(start, san).supportedDiagonalSizeScore, 99)
    // The neighboring support knight remains eligible with the same king and bishop.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('8/8/8/8/8/8/4NK1k/5B2 b - - 1 1', transform)).size, 3)
  }
})

test('three-diagonal king adjacency does not waive same-color off-support restriction', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of ['k1B5/8/8/3N4/8/8/8/7K b - - 0 1']) {
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
    }
    for (const fen of ['k1B5/8/8/1K1N4/8/8/8/8 b - - 0 1']) {
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
    }
  }
})

test('three-diagonal support is evaluated after White moves and bishop safety still applies', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/k2K4/B7/3N4/8/8/8/8 w - - 0 1', transform)
    const move = (to: 'c7' | 'c6') => getChess(fen).move({from: transformSquare('d7', transform), to: transformSquare(to, transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('c6')).supportedDiagonalSizeScore, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('c7')).pieceSafetyScore, 1)
  }
})


test('Ba6 with same-color Kc6 is rejected with previous-stage Nd5, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('k7/8/B1K5/3N4/8/8/8/8 b - - 0 1', transform)).size, 99)
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('k7/8/B7/2KN4/8/8/8/8 b - - 0 1', transform)).size, 99)
    const fen = transformFen('k7/8/2K5/1B1N4/8/8/8/8 w - - 2 2', transform)
    const san = getChess(fen).move({from: transformSquare('b5', transform), to: transformSquare('a6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san).supportedDiagonalSizeScore, 99)
    // A remote knight cannot qualify while Kc6 has no target.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('k7/8/B1K5/8/8/8/7N/8 b - - 0 1', transform)).size, 99)
  }
})


test('Ba6 Kb5 supports every knight with Black inside, including the loaded Nd4 line, across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const black of ['a7', 'a8', 'b8'] as const) {
      for (const knight of allSquares()) {
        if (['a6', 'b5', black].includes(knight)) continue
        const board = getChess('k7/8/B7/1K6/8/8/8/8 b - - 0 1')
        board.remove('a8')
        board.put({type: 'k', color: 'b'}, black)
        board.put({type: 'n', color: 'w'}, knight)
        assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)),
          {size: 3, knight: 99}, `${black}, ${knight}, ${transform.name}`)
      }
    }
    const board = getChess(transformFen('1N6/k7/B7/1K6/8/8/8/8 w - - 0 1', transform))
    for (const [from, to] of [['b8', 'c6'], ['a7', 'a8'], ['c6', 'd4']] as const) {
      board.move({from: transformSquare(from, transform), to: transformSquare(to, transform)})
      if (board.turn() === 'b') assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 3)
    }
    // The king/bishop placement alone cannot support an escaped Black king.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('8/8/B7/1K2k3/3N4/8/8/8 b - - 0 1', transform)).size, 99)
  }
})
