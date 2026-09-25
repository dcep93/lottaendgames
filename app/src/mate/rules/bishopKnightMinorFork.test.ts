import assert from 'node:assert/strict'
import test from 'node:test'
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess'
import {getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove} from './bishopKnight'

test('r7 preserves adjacency without the removed double-attack preference across D4', () => {
  const start = '3k4/8/1NB5/2K5/8/8/8/8 w - - 0 1'
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start, t)
    const move = (from: 'c5', to: 'd4' | 'd5') => getChess(fen).move({from: transformSquare(from, t), to: transformSquare(to, t)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('c5', 'd4')).undefendedMinorForkPenalty, 1)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('c5', 'd5')).undefendedMinorForkPenalty, 0)
    const bishopMove = getChess(fen).move({from: transformSquare('c6', t), to: transformSquare('d5', t)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [bishopMove])
  }
})

test('double-attack metric allows a double attack when either minor piece is defended', () => {
  const cases = [
    ['8/1N6/B1k5/8/3K4/8/8/8 w - - 0 1', 'b7', 'c5'], // Nc5 is king-defended, even after ...Kb6.
    ['8/8/2Bk4/8/1N6/8/8/7K w - - 0 1', 'h1', 'h2'], // Nb4 defends Bc6 after ...Kc5.
    ['8/3k4/2B5/3N4/8/8/8/7K w - - 0 1', 'h1', 'h2'], // Bc6 defends Nd5 after ...Kd6.
  ] as const
  for (const [start, from, to] of cases) for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start, t)
    const move = getChess(fen).move({from: transformSquare(from, t), to: transformSquare(to, t)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).undefendedMinorForkPenalty, 0)
  }
})

test('double-attack metric ignores a geometric fork on an illegal Black destination', () => {
  const start = '3k4/8/2B1N3/8/8/8/8/7K w - - 0 1'
  // ...Ke7 attacks only Ne6; the common attack square d7 is bishop-controlled.
  const board = getChess(start)
  board.move('Kh2')
  assert.ok(board.moves().includes('Ke7'))
  assert.ok(!board.moves().includes('Kd7'))
  assert.equal(scoreKnightAndBishopWhiteMove(start, 'Kh2').undefendedMinorForkPenalty, 0)
})
