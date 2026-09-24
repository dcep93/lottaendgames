import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, transformFen, transformSquare, getChess } from '../chess'
import { getIdealKnightAndBishopWhiteMoves } from './bishopKnight'
import { knightAndBishopDeclaredPreparationMove } from './bishopKnightPreparation'

test('r5 keeps undeclared old exact and wildcard prescriptions cleared across D4', () => {
  for (const fen of [
    '1k6/8/8/8/2NKB3/8/8/8 w - - 0 1',
    '8/k7/8/3B4/2NK4/8/8/8 w - - 2 2',
    '8/2k5/8/3B4/2NK4/8/8/8 w - - 0 1',
    '2k5/8/8/3BK3/2N5/8/8/8 w - - 2 2',
    '8/3k4/5K2/3B4/2N5/8/8/8 w - - 4 3',
    '8/2k2K2/8/3B4/2N5/8/8/8 w - - 6 4',
    '1k6/8/8/3BK3/2N5/8/8/8 w - - 0 1',
    '2k5/8/3K4/3B4/2N5/8/8/8 w - - 2 2',
    '8/2k1K3/8/3B4/2N5/8/8/8 w - - 4 3',
    '2k1K3/8/8/3B4/2N5/8/8/8 w - - 6 4',
    '8/3k2K1/8/3B4/2N5/8/8/8 w - - 2 2',
    '8/3B4/1k6/3K4/8/3N4/8/8 w - - 0 1',
    '8/8/8/8/6K1/7B/4N2k/8 w - - 0 1',
    '8/8/3k4/8/4BK2/3N4/8/8 w - - 0 1',
    '8/8/5k2/8/4BK2/3N4/8/8 w - - 0 1',
    '8/6k1/8/5K2/4B3/3N4/8/8 w - - 0 1',
    '8/8/8/4K3/8/3k3B/8/5N2 w - - 0 1',
    '8/8/8/8/3NK3/2kB4/8/8 w - - 2 2',
    '8/8/8/4K3/8/7B/4k3/5N2 w - - 0 1',
    '8/8/8/8/8/k3N3/2BK4/8 w - - 2 2',
    '8/5k2/8/4K3/4B3/3N4/8/8 w - - 2 2',
    '8/8/8/3N4/3K4/5B2/5k2/8 w - - 2 2',
    '8/8/4k2K/8/4B3/3N4/8/8 w - - 2 2',
    '6k1/8/7K/8/4B3/3N4/8/8 w - - 0 1',
    '8/8/8/8/1K6/N7/1k6/7B w - - 0 1',
    '8/8/8/8/8/2K5/1N6/1k5B w - - 0 1',
    '8/8/8/4k3/3NB3/3K4/8/8 w - - 0 1',
    '8/5k2/8/8/4B3/3NK3/8/8 w - - 0 1',
    '8/8/4k3/8/4B3/3NK3/8/8 w - - 0 1',
    '8/4k3/8/8/4B3/3NK3/8/8 w - - 0 1',
    '8/3k4/8/8/4B3/3NK3/8/8 w - - 0 1',
    '8/8/5k2/8/4B3/3NK3/8/8 w - - 0 1',
    '8/6k1/8/8/3KB3/3N4/8/8 w - - 0 1',
    '8/8/7k/4K3/4B3/3N4/8/8 w - - 0 1',
    '8/8/8/4K1k1/4B3/3N4/8/8 w - - 0 1',
    '8/6k1/8/2N5/3KB3/8/8/8 w - - 0 1',
    '8/4k3/8/2N5/3KB3/8/8/8 w - - 2 2',
    '8/8/3N4/2KBk3/8/8/8/8 w - - 0 1',
    '8/8/4k3/8/3KB3/3N4/8/8 w - - 2 2',
    '8/8/3k4/8/4B3/3NK3/8/8 w - - 4 3',
    '8/8/4k3/8/4BK2/3N4/8/8 w - - 6 4',
    '8/8/3k4/6K1/4B3/3N4/8/8 w - - 8 5',
    '8/5k2/8/6K1/4B3/3N4/8/8 w - - 2 2',
    '8/5k2/3K4/8/4B3/3N4/8/8 w - - 0 1',
    '8/2k5/8/3K4/4B3/3N4/8/8 w - - 0 1',
    '8/4k3/2K5/8/4B3/3N4/8/8 w - - 0 1',
    '4k3/2K5/8/8/4B3/3N4/8/8 w - - 0 1',
    '8/5k2/8/5K2/4B3/3N4/8/8 w - - 2 2',
    '8/8/3K1k2/8/4B3/3N4/8/8 w - - 2 2',
    '8/8/3k4/8/4BKN1/8/8/8 w - - 0 1',
    '8/8/6kN/8/6B1/7K/8/8 w - - 0 1',
    '8/8/8/8/4N3/5K2/6Bk/8 w - - 0 1',
    '8/8/8/2KB4/3N1k2/8/8/8 w - - 0 1',
  ]) for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(knightAndBishopDeclaredPreparationMove(transformFen(fen, transform)), undefined)
  }
})


test('r5 prescribes Ke7 and then Ne5 in the declared line across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const chess = getChess(transformFen('8/2k5/5K2/3B4/2N5/8/8/8 w - - 0 1', transform))
    for (const [from, to, replyFrom, replyTo] of [
      ['f6', 'e7', 'c7', 'c8'], ['c4', 'e5', 'c8', 'c7'],
    ] as const) {
      const expected = transformSquare(from, transform) + transformSquare(to, transform)
      assert.equal(knightAndBishopDeclaredPreparationMove(chess.fen()), expected)
      const move = chess.moves({ verbose: true }).find(m => m.from + m.to === expected)!
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(chess.fen()), [move.san])
      chess.move(move.san)
      chess.move({ from: transformSquare(replyFrom, transform), to: transformSquare(replyTo, transform) })
    }
  }
})


test('r5 prescribes Be6 only for the declared placement across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/3B4/2Nk1K2/8/8/8 w - - 0 1', transform)
    const expected = transformSquare('d5', transform) + transformSquare('e6', transform)
    assert.equal(knightAndBishopDeclaredPreparationMove(fen), expected)
    const san = getChess(fen).moves({ verbose: true }).find(m => m.from + m.to === expected)!.san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san])
    assert.equal(knightAndBishopDeclaredPreparationMove(transformFen('8/8/8/3B4/2N2K2/3k4/8/8 w - - 0 1', transform)), undefined)
  }
})


test('r5 prescribes moves 2–7 of the Kh7 line across D4, regardless of counters', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const original = getChess('8/7k/4N3/3BK3/8/8/8/8 w - - 0 1')
    for (const [index, san] of [
      'Kf6', 'Kh8', 'Nd8', 'Kh7', 'Nf7', 'Kg8', 'Be4', 'Kf8',
      'Bh7', 'Ke8', 'Ne5', 'Kd8', 'Bg8', 'Ke8',
    ].entries()) {
      const before = original.fen()
      const move = original.move(san)
      if (index < 2 || index % 2 !== 0) continue
      const fen = transformFen(before, transform)
      const from = transformSquare(move.from, transform)
      const to = transformSquare(move.to, transform)
      const expected = getChess(fen).move({ from, to }).san
      assert.equal(knightAndBishopDeclaredPreparationMove(fen), from + to)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected])
      const resetCounters = fen.split(' ').slice(0, 4).join(' ') + ' 0 1'
      assert.equal(knightAndBishopDeclaredPreparationMove(resetCounters), from + to)
    }
  }
})


test('r5 prescribes Nf4 and Kf6 in the declared Ke8 line across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const original = getChess('8/4k3/4N3/3B4/4K3/8/8/8 w - - 0 1')
    for (const [index, san] of ['Ke5', 'Ke8', 'Nf4', 'Kf8', 'Kf6', 'Ke8'].entries()) {
      const before = original.fen()
      const move = original.move(san)
      if (index < 2 || index % 2 !== 0) continue
      const fen = transformFen(before, transform)
      const from = transformSquare(move.from, transform)
      const to = transformSquare(move.to, transform)
      const expected = getChess(fen).move({ from, to }).san
      assert.equal(knightAndBishopDeclaredPreparationMove(fen), from + to)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected])
    }
  }
})


test('r5 prescribes second-move Nf4 after Kf5 Ke8 across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('8/5k2/4N3/3B4/4K3/8/8/8 w - - 0 1', transform))
    board.move({from: transformSquare('e4', transform), to: transformSquare('f5', transform)})
    board.move({from: transformSquare('f7', transform), to: transformSquare('e8', transform)})
    const before = board.fen()
    const from = transformSquare('e6', transform)
    const to = transformSquare('f4', transform)
    const san = board.move({from, to}).san
    assert.equal(knightAndBishopDeclaredPreparationMove(before), from + to)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [san])
  }
})
