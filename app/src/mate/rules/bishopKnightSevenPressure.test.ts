import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove, knightAndBishopWhiteRules } from './bishopKnight'
import { sevenDiagonalPressureContext, sevenDiagonalPressureScore } from './bishopKnightSevenPressure'

test('seven-diagonal pressure prefers the complete loaded arrangement over f8', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/4k1K1/8/3B4/8/3N4/8/8 w - - 2 2', transform)
    const context = sevenDiagonalPressureContext(before)
    const after = (from: 'd5' | 'g7', to: 'f7' | 'f8') => {
      const board = getChess(before)
      board.move({from: transformSquare(from, transform), to: transformSquare(to, transform)})
      return sevenDiagonalPressureScore(board.fen(), context)
    }
    assert.equal(after('d5', 'f7'), 0)
    assert.equal(sevenDiagonalPressureScore(transformFen('5K2/8/4k3/3B4/8/3N4/8/8 b - - 0 1', transform), context), 5)
    const wrongBlack = transformFen('8/3k1BK1/8/8/8/3N4/8/8 w - - 0 1', transform)
    assert.notEqual(sevenDiagonalPressureScore(wrongBlack, context), 0)
  }
})

test('seven-diagonal pressure otherwise prefers occupying e6 before approaching e7', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('3k4/8/5K2/3B4/8/3N4/8/8 w - - 0 1', transform)
    const context = sevenDiagonalPressureContext(before)
    const score = (to: 'g7' | 'e6') => {
      const board = getChess(before)
      board.move({from: transformSquare('f6', transform), to: transformSquare(to, transform)})
      return sevenDiagonalPressureScore(board.fen(), context)
    }
    assert.equal(score('g7'), 7)
    assert.equal(score('e6'), 1)
  }
  assert.equal(sevenDiagonalPressureContext('4k3/8/5K2/3B4/4N3/8/8/8 w - - 0 1').length, 0)
})

test('the g7 approach against e8 and the complete arrangement are uniquely preferred', () => {
  assert.ok(knightAndBishopWhiteRules.findIndex(rule => rule.id === 'r1.5') < knightAndBishopWhiteRules.findIndex(rule => rule.id === 'r2.5'))
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('4k3/8/5K2/3B4/8/3N4/8/8 w - - 0 1', transform))
    for (const [from, to] of [['f6','g7'], ['e8','e7'], ['d5','f7']] as const) {
      const fen = board.fen()
      const move = board.move({from: transformSquare(from, transform), to: transformSquare(to, transform)})
      if (move.color !== 'w') continue
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move.san])
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move.san).supportedDiagonalSizeScore, 7)
    }
  }
})

test('r2.5 prefers Bb3 after king proximity, in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('5K2/2k5/4B3/8/8/3N4/8/8 w - - 0 1', transform)
    const move = (to: 'b3' | 'd5') => getChess(fen).move({from: transformSquare('e6', transform), to: transformSquare(to, transform)}).san
    const preferred = scoreKnightAndBishopWhiteMove(fen, move('b3'))
    const other = scoreKnightAndBishopWhiteMove(fen, move('d5'))
    assert.equal(preferred.cornerPressureScore, other.cornerPressureScore)
    assert.equal(preferred.cornerPressureBishopScore, 0)
    assert.equal(other.cornerPressureBishopScore, 2)
    const kingMoveFirst = getChess(fen).move({from: transformSquare('f8', transform), to: transformSquare('e7', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [kingMoveFirst])
    const approach = transformFen('3k4/6K1/8/3B4/8/3N4/8/8 w - - 0 1', transform)
    const kingMove = getChess(approach).move({from: transformSquare('g7', transform), to: transformSquare('f7', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(approach), [kingMove])
  }
})

test('r2.5 prefers Bc4 over other bishop squares when Bb3 cannot stay put, in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/3k1K2/8/8/8/1B1N4/8/8 w - - 0 1', transform)
    const move = (to: 'c4' | 'd5') => getChess(fen).move({from: transformSquare('b3', transform), to: transformSquare(to, transform)}).san
    const preferred = scoreKnightAndBishopWhiteMove(fen, move('c4'))
    const other = scoreKnightAndBishopWhiteMove(fen, move('d5'))
    assert.equal(preferred.supportedDiagonalSizeScore, 7)
    assert.equal(preferred.cornerPressureScore, other.cornerPressureScore)
    assert.equal(preferred.cornerPressureBishopScore, 1)
    assert.equal(other.cornerPressureBishopScore, 2)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move('c4')])
  }
})

test('equal e7 proximity prefers Ke8 toward the target corner', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('5K2/8/3k4/8/8/1B1N4/8/8 w - - 2 2', transform)
    const preferred = getChess(fen).move({from: transformSquare('f8', transform), to: transformSquare('e8', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [preferred])
    const score = scoreKnightAndBishopWhiteMove(fen, preferred)
    assert.equal(score.cornerPressureScore, 4)
    assert.equal(score.supportedDiagonalSizeScore, 7)

  }
})

test('losing the c7/e7 race rejects Ba4; existing seven-diagonal preferences remain', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('4K3/2k5/8/8/8/1B1N4/8/8 w - - 0 1', transform)
    const bishopMove = getChess(fen).move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, bishopMove).supportedDiagonalSizeScore, 99)
    const kingMove = getChess(fen).move({from: transformSquare('e8', transform), to: transformSquare('e7', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [kingMove])
    const context = sevenDiagonalPressureContext(fen)
    const e8 = sevenDiagonalPressureScore(fen, context)
    const f8 = sevenDiagonalPressureScore(transformFen('5K2/2k5/8/8/8/1B1N4/8/8 w - - 0 1', transform), context)
    assert.equal(e8, 4)
    assert.equal(f8, 5)
  }
})


test('Black on the a-file makes king proximity to c5 precede e7 occupancy in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/3K4/k7/8/1B1N4/8/8 w - - 4 3', transform)
    const move = (to: 'c5' | 'e7') => getChess(fen).move({from: transformSquare('d6', transform), to: transformSquare(to, transform)}).san
    const preferred = move('c5')
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [preferred])
    assert.equal(scoreKnightAndBishopWhiteMove(fen, preferred).supportedDiagonalSizeScore, 7)
    assert.ok(scoreKnightAndBishopWhiteMove(fen, preferred).cornerPressureScore < scoreKnightAndBishopWhiteMove(fen, move('e7')).cornerPressureScore)
    const offFile = transformFen('8/1k6/3K4/8/2B5/3N4/8/8 w - - 4 3', transform)
    const toE7 = getChess(offFile).move({from: transformSquare('d6', transform), to: transformSquare('e7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(offFile, toE7).cornerPressureScore, 3)
  }
})


test('against a3/a4 the seven-diagonal king follows d4-c3-b2, with c2 available when b2 is illegal', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('8/8/8/2K5/k1B5/3N4/8/8 w - - 0 1', transform))
    for (const [from, to] of [['c5','d4'], ['a4','a3'], ['d4','c3'], ['a3','a4'], ['c3','b2']] as const) {
      const fen = board.fen()
      const move = board.move({from: transformSquare(from, transform), to: transformSquare(to, transform)})
      if (move.color !== 'w') continue
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move.san])
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move.san).supportedDiagonalSizeScore, 7)
    }
    const waiting = transformFen('8/8/8/8/2B5/k1KN4/8/8 w - - 0 1', transform)
    const move = getChess(waiting).move({from: transformSquare('c3', transform), to: transformSquare('c2', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(waiting), [move])
    assert.equal(scoreKnightAndBishopWhiteMove(waiting, move).supportedDiagonalSizeScore, 7)
  }
})


test('Black on a5 prefers Bb3 before c5 king proximity, including the Kd4 route position', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      '8/8/8/k7/2BK4/3N4/8/8 w - - 2 2',
      '8/8/3K4/k7/2B5/3N4/8/8 w - - 0 1',
    ]) {
      const before = transformFen(fen, transform)
      const bishop = getChess(before).move({from: transformSquare('c4', transform), to: transformSquare('b3', transform)}).san
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [bishop])
      assert.equal(scoreKnightAndBishopWhiteMove(before, bishop).supportedDiagonalSizeScore, 7)
    }
  }
})


test('Black on c6, b5 or b6 makes king proximity to d6 precede e7 occupancy', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const black of ['c6', 'b5', 'b6'] as const) {
      const board = getChess('8/4K3/8/8/8/1B1N4/8/7k w - - 0 1')
      board.remove('h1')
      board.put({color: 'b', type: 'k'}, black)
      const before = transformFen(board.fen(), transform)
      const king = getChess(before).move({from: transformSquare('e7', transform), to: transformSquare(black === 'c6' ? 'e6' : 'd6', transform)}).san
      const bishop = getChess(before).move({from: transformSquare('b3', transform), to: transformSquare('c4', transform)}).san
      
      assert.equal(scoreKnightAndBishopWhiteMove(before, king).supportedDiagonalSizeScore, 7)
      assert.ok(scoreKnightAndBishopWhiteMove(before, king).cornerPressureScore < scoreKnightAndBishopWhiteMove(before, bishop).cornerPressureScore)
    }
  }
})


test('2. Kd6 is uniquely preferred over Bb3 in the loaded position with Black on b6', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/4K3/1k6/8/2B5/3N4/8/8 w - - 2 2', transform)
    const king = getChess(before).move({from: transformSquare('e7', transform), to: transformSquare('d6', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [king])
  }
})


test('2. Kf7 breaks the Bb3-Bd5 loop by approaching e6 in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('5K2/3k4/8/8/8/1B1N4/8/8 w - - 2 2', transform)
    const move = (from: 'f8' | 'b3', to: 'f7' | 'd5') => getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
    const king = move('f8', 'f7')
    const bishop = move('b3', 'd5')
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [king])
    assert.equal(scoreKnightAndBishopWhiteMove(fen, king).supportedDiagonalSizeScore, 7)
    assert.ok(scoreKnightAndBishopWhiteMove(fen, king).cornerPressureScore < scoreKnightAndBishopWhiteMove(fen, bishop).cornerPressureScore)
  }
})


test('Black on e8 or f8 makes seven-diagonal king proximity to g7 first in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      '4k3/8/5K2/8/8/1B1N4/8/8 w - - 2 2',
      '5k2/8/5K2/8/8/1B1N4/8/8 w - - 0 1',
    ]) {
      const before = transformFen(fen, transform)
      const move = (to: 'g7' | 'g6' | 'e6') => getChess(before).move({from: transformSquare('f6', transform), to: transformSquare(to, transform)}).san
      const preferred = move(fen.startsWith('4k3') ? 'g7' : 'g6')
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [preferred])
      assert.equal(scoreKnightAndBishopWhiteMove(before, preferred).supportedDiagonalSizeScore, 7)
      assert.ok(scoreKnightAndBishopWhiteMove(before, preferred).cornerPressureScore < scoreKnightAndBishopWhiteMove(before, move('e6')).cornerPressureScore)
    }
  }
})


test('Black on e7 prefers king proximity to g7 and breaks the loaded loop in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/4k3/6K1/8/8/1B1N4/8/8 w - - 0 1', transform)
    const move = (to: 'g7' | 'f5') => getChess(fen).move({from: transformSquare('g6', transform), to: transformSquare(to, transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move('g7')])
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('g7')).supportedDiagonalSizeScore, 7)
    assert.ok(scoreKnightAndBishopWhiteMove(fen, move('g7')).cornerPressureScore < scoreKnightAndBishopWhiteMove(fen, move('f5')).cornerPressureScore)
  }
})


test('seven-diagonal fallback prefers e6 occupancy, otherwise proximity to e7 in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/3k2K1/8/8/8/1B1N4/8/8 w - - 2 2', transform)
    const move = (to: 'f7' | 'f6') => getChess(fen).move({from: transformSquare('g7', transform), to: transformSquare(to, transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move('f7')])
    assert.ok(scoreKnightAndBishopWhiteMove(fen, move('f7')).cornerPressureScore < scoreKnightAndBishopWhiteMove(fen, move('f6')).cornerPressureScore)
    const context = sevenDiagonalPressureContext(fen)
    const occupied = sevenDiagonalPressureScore(transformFen('2k5/8/4K3/8/8/1B1N4/8/8 b - - 0 1', transform), context)
    const target = sevenDiagonalPressureScore(transformFen('2k5/4K3/8/8/8/1B1N4/8/8 b - - 0 1', transform), context)
    assert.ok(occupied < target)
  }
})


test('final force-to-corner tie-break selects Kf8 over Kf6 in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('3k4/5BK1/8/8/8/3N4/8/8 w - - 4 3', transform)
    const move = (to: 'f8' | 'f6') => getChess(fen).move({from: transformSquare('g7', transform), to: transformSquare(to, transform)}).san
    const first = scoreKnightAndBishopWhiteMove(fen, move('f8'))
    const second = scoreKnightAndBishopWhiteMove(fen, move('f6'))
    assert.equal(first.cornerPressureScore, second.cornerPressureScore)
    assert.equal(first.cornerPressureBishopScore, second.cornerPressureBishopScore)
    assert.equal(first.forceCornerKingProximityScore, 25)
    assert.equal(second.forceCornerKingProximityScore, 29)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move('f8')])
  }
})
