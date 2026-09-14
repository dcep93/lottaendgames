import assert from 'node:assert/strict'
import test from 'node:test'
import { getMateRuleSet } from './index'
import { allSquares, getChess, kingDistance, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { knightAndBishopShouldCheckThreeDiagonal, knightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'
import { sevenDiagonalPressureContext } from './bishopKnightSevenPressure'
import { fiveDiagonalPressureScore } from './bishopKnightFivePressure'
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight'

test('a legal Black step onto any cage diagonal invalidates its support', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, escape] of [
      ['8/k1K5/B7/8/8/2N5/8/8 b - - 0 1', 'a6'],
      ['8/3B4/2K5/k2N4/8/8/8/8 b - - 0 1', 'a4'],
      ['5k2/8/4K3/8/8/1B1N4/8/8 b - - 0 1', 'g8'],
    ] as const) {
      const position = transformFen(fen, transform)
      const replies = getChess(position).moves({verbose: true}).map(move => move.to)
      assert.ok(replies.includes(transformSquare(escape, transform)))
      assert.equal(knightAndBishopSupportedDiagonal(position).size, 99)
      assert.equal(knightAndBishopSupportedDiagonal(position, replies).size, 99)
    }
    assert.equal(knightAndBishopShouldCheckThreeDiagonal(transformFen('8/k1K5/B7/8/8/2N5/8/8 w - - 0 1', transform)), false)
    const fen = transformFen('8/3B4/8/k1KN4/8/8/8/8 w - - 0 1', transform)
    const move = (to: 'c6' | 'd6') => getChess(fen).move({from: transformSquare('c5', transform), to: transformSquare(to, transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('c6')).supportedDiagonalSizeScore, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('d6')).supportedDiagonalSizeScore, 5)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(move('c6')))
  }
})

test('ordinary cage support requires Black strictly inside, including r1 and corner pressure', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, size, boundary, outside] of [
      ['k7/2K5/B7/8/8/2N5/8/8 b - - 0 1', 3, 'b7', 'a2'],
      ['k7/8/3K4/8/B7/3N4/8/8 b - - 0 1', 5, 'c6', 'h8'],
      ['k7/8/5K2/8/8/1B1N4/8/8 b - - 0 1', 7, 'd5', 'h8'],
    ] as const) {
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, size)
      for (const square of [boundary, outside]) {
        const board = getChess(fen)
        board.remove('a8')
        board.put({color: 'b', type: 'k'}, square)
        assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, 99)
      }
    }
    const before = transformFen('2B5/8/1K6/8/8/8/k1N5/8 w - - 0 1', transform)
    assert.equal(knightAndBishopShouldCheckThreeDiagonal(before), false)
    const move = getChess(before).move({from: transformSquare('b6', transform), to: transformSquare('c5', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    assert.equal(sevenDiagonalPressureContext(transformFen('7k/8/5K2/8/8/1B1N4/8/8 w - - 0 1', transform)).length, 0)
    assert.deepEqual(fiveDiagonalPressureScore(transformFen('7k/8/3K4/3N4/B7/8/8/8 w - - 0 1', transform)), {king: 0, bishop: 0, approach: null, cornerProximity: 0, sevenSupportKingProximity: 0})
  }
})

test('Nd3 supports the seven-diagonal near f7 or from rank five above and right of Black, in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const square of allSquares()) {
      if (['d3', 'd5'].includes(square) || kingDistance(square, 'a8') <= 1) continue
      const board = getChess('k7/8/8/3B4/8/3N4/8/7K b - - 0 1')
      board.remove('h1')
      board.put({color: 'w', type: 'k'}, square)
      const winsRaces = kingDistance(square, 'd5') < 3 && kingDistance(square, 'f6') < 5 && kingDistance(square, 'g7') < 6
      assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)),
        (winsRaces || kingDistance(square, 'f7') <= 1 || (square[1] >= '5' && square[0] > 'a')) ? {size: 7, knight: 0} : {size: 99, knight: 99})
    }
    for (const fen of [
      '4k3/8/5K2/3B4/4N3/8/8/8 b - - 0 1', // The old Kf6/rank-eight shortcut no longer suffices.
      '4k3/8/5K2/8/4B3/3N4/8/8 b - - 0 1', // Bishop is off the seven-diagonal.
    ]) assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(fen, transform)), {size: 99, knight: 99})
    // Black outside the diagonal invalidates support.
    assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen('8/6k1/4K3/3B4/8/3N4/8/8 b - - 0 1', transform)), {size: 99, knight: 99})
  }
})

test('support is measured after White moves: entering, leaving, and moving the knight away', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, from, to, expected] of [
      ['4k3/8/8/3BK3/8/3N4/8/8 w - - 0 1', 'e5', 'f6', 7],
      ['4k3/8/5K2/3B4/8/3N4/8/8 w - - 0 1', 'f6', 'e5', 99],
      ['4k3/8/5K2/3B4/8/3N4/8/8 w - - 0 1', 'd3', 'f4', 7],
    ] as const) {
      const before = transformFen(fen, transform)
      const move = getChess(before).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, expected)
    }
  }
})

test('Ne5 supports the seven-diagonal while approaching d3 unless Black has an immediate escape', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('5k2/5N2/6K1/3B4/8/8/8/8 w - - 2 2', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('f7', transform), to: transformSquare('e5', transform)})
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 7, knight: 1})
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move.san])
    for (const square of ['a3', 'b4', 'c5', 'd6'] as const) {
      assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen(), [transformSquare(square, transform)]), {size: 99, knight: 99})
    }
    const escaping = transformFen('8/3k4/6K1/3BN3/8/8/8/8 b - - 0 1', transform)
    assert.ok(getChess(escaping).moves({verbose: true}).some(reply => reply.to === transformSquare('d6', transform)))
    assert.deepEqual(knightAndBishopSupportedDiagonal(escaping), {size: 99, knight: 99})
  }
})

test('2. Kf8 remains supported, but Kf7 is now preferred toward e7 after Kg7 Kd8', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('3k4/6K1/8/3B4/8/3N4/8/8 w - - 2 2', transform)
    const move = getChess(fen).move({from: transformSquare('g7', transform), to: transformSquare('f8', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).supportedDiagonalSizeScore, 7)
    const preferred = getChess(fen).move({from: transformSquare('g7', transform), to: transformSquare('f7', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [preferred])
  }
})

test('with Nd3 and Black on a8, Ba4 supports the five-diagonal regardless of king position', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const square of allSquares()) {
      if (['a4', 'd3'].includes(square) || kingDistance(square, 'a8') <= 1) continue
      const board = getChess('k7/8/8/8/B7/3N4/8/7K b - - 0 1')
      board.remove('h1')
      board.put({color: 'w', type: 'k'}, square)
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size,
        5)
    }
    // White on e4 ties Black on all three opposite-side squares.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('1k6/8/8/1B6/4K3/3N4/8/8 b - - 0 1', transform)).size, 5)
    const before = transformFen('1k6/4K3/8/8/8/1B1N4/8/8 w - - 0 1', transform)
    const move = getChess(before).move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
  }
})

test('Nf4 then Nd5 preserve support and improve the knight route in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('2k5/8/3K4/8/B7/3N4/8/8 w - - 0 1', transform))
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: 2})
    for (const [from, to, distance] of [['d3','f4',1], ['c8','b7',null], ['f4','d5',0]] as const) {
      const fen = board.fen()
      const move = board.move({from: transformSquare(from, transform), to: transformSquare(to, transform)})
      if (distance === null) continue
      assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: distance})
      assert.ok(getIdealKnightAndBishopWhiteMoves(fen).includes(move.san), move.san)
    }
  }
})

test('edge-bishop support rejects an off-diagonal king and an immediate six-diagonal escape', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const approach = transformFen('8/k7/8/8/B4N2/8/8/7K b - - 0 1', transform)
    assert.ok(getChess(approach).moves({verbose: true}).some(move => move.to === transformSquare('b6', transform)))
    assert.equal(knightAndBishopSupportedDiagonal(approach).size, 99)
    const arrived = transformFen('8/8/1k6/3N4/B7/8/8/7K b - - 0 1', transform)
    assert.ok(getChess(arrived).moves({verbose: true}).some(move => move.to === transformSquare('c5', transform)))
    assert.equal(knightAndBishopSupportedDiagonal(arrived).size, 99)
    const held = transformFen('8/1k6/3K4/3N4/B7/8/8/8 b - - 0 1', transform)
    assert.deepEqual(knightAndBishopSupportedDiagonal(held), {size: 5, knight: 0})
  }
})

test('edge bishop and Nd5 support the three-diagonal when White is adjacent to one of its squares', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      'k2K4/8/B7/3N4/8/8/8/8 b - - 0 1',
      'k1BK4/8/8/3N4/8/8/8/8 b - - 0 1',
      'k7/8/B1K5/3N4/8/8/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 3)
    for (const fen of [
      'k2K4/1B6/8/3N4/8/8/8/8 b - - 0 1', // Bishop is not on the edge.
      'k2K4/8/B7/8/8/3N4/8/8 b - - 0 1', // Knight is not on the five-diagonal support square.
      'k7/8/B7/3N4/4K3/8/8/8 b - - 0 1', // King is not adjacent to the three-diagonal.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
    const before = transformFen('k2K4/8/8/1B1N4/8/8/8/8 w - - 0 1', transform)
    const move = getChess(before).move({from: transformSquare('b5', transform), to: transformSquare('a6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 3)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
  }
})

test('king-supported three-diagonal uses both non-edge knight targets attacking the opposition square', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [knight, expectedDistance] of [['d5',2], ['b5',0], ['c6',0], ['c8',2]] as const) {
      const board = getChess('k7/2K5/B7/8/8/8/8/8 b - - 0 1')
      board.put({color: 'w', type: 'n'}, knight)
      assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)), {size: 3, knight: expectedDistance})
    }
    const fen = transformFen('k1B5/2K5/8/3N4/8/8/8/8 w - - 0 1', transform)
    const choices = getIdealKnightAndBishopWhiteMoves(fen)
    assert.ok(choices.length > 0)
    for (const san of choices) {
      const board = getChess(fen)
      const move = board.move(san)
      assert.equal(move.piece, 'n')
      assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 3, knight: 1})
    }
    const bishopMove = getChess(fen).move({from: transformSquare('c8', transform), to: transformSquare('a6', transform)}).san
    assert.ok(!choices.includes(bishopMove))
  }
})


test('Ba6+ supports the three-diagonal from a king on or adjacent to d8 if Black cannot attack the bishop', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('2k1K3/8/8/1B1N4/8/8/8/8 w - - 2 2', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('b5', transform), to: transformSquare('a6', transform)})
    assert.ok(board.isCheck())
    const replies = board.moves({verbose: true}).map(reply => reply.to)
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 3)
    assert.equal(knightAndBishopSupportedDiagonal(board.fen(), replies).size, 3)
    assert.equal(scoreKnightAndBishopWhiteMove(before, move.san).supportedDiagonalSizeScore, 3)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move.san])
    for (const fen of [
      '1k2K3/8/B7/3N4/8/8/8/8 b - - 0 1', // Ka7 attacks the bishop.
      '2k5/8/B2K4/3N4/8/8/8/8 b - - 0 1', // d6 no longer qualifies.
      '2k5/8/B3K3/3N4/8/8/8/8 b - - 0 1', // e6 no longer qualifies.
      '2k2K2/8/B7/3N4/8/8/8/8 b - - 0 1', // White is not on or adjacent to d8.
      '2k1K3/8/B7/8/8/3N4/8/8 b - - 0 1', // Knight is not on d5.
      '2k1K3/1B6/8/3N4/8/8/8/8 b - - 0 1', // Bishop is off the edge.
      '4K3/8/B7/3N3k/8/8/8/8 b - - 0 1', // Black is outside the diagonal.
    ]) assert.notEqual(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 3)
  }
})


test('the d6 loop no longer establishes a supported three-diagonal with Ba6+', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('2k5/8/3K4/1B1N4/8/8/8/8 w - - 0 1', transform)
    const move = getChess(fen).move({from: transformSquare('b5', transform), to: transformSquare('a6', transform)}).san
    assert.notEqual(scoreKnightAndBishopWhiteMove(fen, move).supportedDiagonalSizeScore, 3)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(move))
  }
})

test('Kd6 and an edge bishop at least three steps from Black allow Nf4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/1k6/3K4/8/B7/3N4/8/8 w - - 0 1', transform)
    const board = getChess(fen)
    const move = board.move({from: transformSquare('d3', transform), to: transformSquare('f4', transform)}).san
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: 1})
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    for (const unsupported of [
      '8/2k5/5K2/8/B4N2/8/8/8 b - - 0 1', // White controls e7 but not d6.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(unsupported, transform)).size, 99)
  }
})

test('Ke7 supports Nf4 through the six-diagonal races even when Black can reach b6', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/2k1K3/8/8/B7/3N4/8/8 w - - 0 1', transform)
    const board = getChess(fen)
    const move = board.move({from: transformSquare('d3', transform), to: transformSquare('f4', transform)}).san
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
  }
})

test('Nd3 permits other five-diagonal bishop squares when defended or at least three steps from Black', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const king of ['d6', 'e6', 'e7', 'f7'] as const) {
      for (const bishop of ['a4', 'b5', 'c6', 'd7', 'e8'] as const) {
        const board = getChess('k7/8/8/8/8/3N4/8/7K b - - 0 1')
        board.remove('h1')
        board.put({color: 'w', type: 'k'}, king)
        board.put({color: 'w', type: 'b'}, bishop)
        const expected = ['a4', 'b5'].includes(bishop) || kingDistance(king, bishop) === 1 || kingDistance('a8', bishop) >= 3 ? 5 : 99
        assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, expected, `${king} ${bishop}`)
      }
    }
    const board = getChess(transformFen('8/2k2K2/2B5/8/8/3N4/8/8 w - - 0 1', transform))
    board.move({from: transformSquare('c6', transform), to: transformSquare('d5', transform)})
    board.move({from: transformSquare('c7', transform), to: transformSquare('b8', transform)})
    const before = board.fen()
    const move = board.move({from: transformSquare('d5', transform), to: transformSquare('c6', transform)}).san
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(before, move)?.id, 'r1.5')
    for (const bishop of ['c6', 'd7', 'e8'] as const) {
      const arrived = getChess('k7/8/8/3N4/8/8/8/5K2 b - - 0 1')
      arrived.put({color: 'w', type: 'b'}, bishop)
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(arrived.fen(), transform)).size, 5)
    }
  }
})


test('Bc6 and Kd6 support the five-diagonal when Black cannot legally reach b4, allowing Nf4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('1k6/8/2BK4/8/8/3N4/8/8 w - - 0 1', transform)
    const board = getChess(fen)
    const move = board.move({from: transformSquare('d3', transform), to: transformSquare('f4', transform)}).san
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: 1})
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    const defended = transformFen('8/8/2BK4/k7/5N2/8/8/8 b - - 0 1', transform)
    assert.ok(getChess(defended).moves({verbose: true}).some(move => move.to === transformSquare('b4', transform)))
    // A reflected defended-bishop condition must not bypass the b4 escape.
    assert.ok(!getChess(defended).moves({verbose: true}).some(move => move.to === transformSquare('c7', transform)))
    assert.equal(knightAndBishopSupportedDiagonal(defended).size, 99)
    for (const unsupported of [
      '1k6/8/2BK4/8/8/8/8/7N b - - 0 1', // Knight is more than one move from d5.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(unsupported, transform)).size, 99)
  }
})

test('Nd3 and Kc5 support Ba4 against a Black king on the a-file', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('8/8/k2K4/8/B7/3N4/8/8 w - - 0 1', transform))
    board.move({from: transformSquare('d6', transform), to: transformSquare('c5', transform)})
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: 2})
  }
})


test('Nf4 remains supported when Black can reach b6 but cannot reach b4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/k7/2BK4/8/8/3N4/8/8 w - - 0 1', transform)
    const board = getChess(fen)
    const move = board.move({from: transformSquare('d3', transform), to: transformSquare('f4', transform)}).san
    assert.ok(getChess(board.fen()).moves({verbose: true}).some(reply => reply.to === transformSquare('b6', transform)))
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: 1})
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    board.move({from: transformSquare('a7', transform), to: transformSquare('b6', transform)})
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: 1})
  }
})

test('Bb5 is supported by Nd3 and White on or adjacent to d7', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const king of ['c6', 'd6', 'e6', 'c7', 'd7', 'e7', 'c8', 'd8', 'e8'] as const) {
      const board = getChess('k7/8/8/1B6/8/3N4/8/7K b - - 0 1')
      board.remove('h1')
      board.put({color: 'w', type: 'k'}, king)
      assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)), {size: 5, knight: 2})
    }
    const fen = transformFen('8/1k2K3/8/8/2B5/3N4/8/8 w - - 2 2', transform)
    const board = getChess(fen)
    const move = board.move({from: transformSquare('c4', transform), to: transformSquare('b5', transform)}).san
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: 2})
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    const approaching = transformFen('8/1k2K3/8/1B6/5N2/8/8/8 b - - 0 1', transform)
    assert.deepEqual(knightAndBishopSupportedDiagonal(approaching), {size: 5, knight: 1})
  }
})


test('a defended bishop and control of d6 support a knight approaching d5 when Black cannot reach c5 or b4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('1k6/3BK3/8/8/8/3N4/8/8 w - - 2 2', transform)
    const board = getChess(fen)
    const move = board.move({from: transformSquare('d3', transform), to: transformSquare('f4', transform)}).san
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: 1})
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    for (const unsupported of [
      '8/3BK3/1k6/8/5N2/8/8/8 b - - 0 1', // Black can reach c5 but cannot move to its current square b6.
      '8/3B4/3K4/k7/5N2/8/8/8 b - - 0 1', // Black can reach b4 after Nf4.
      'k7/3BK3/8/8/8/8/8/7N b - - 0 1', // Knight is more than one move from d5.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(unsupported, transform)).size, 99)
  }
})

test('Nf4 preserves five-diagonal support when Kd6 can answer Kb6, in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const king of ['e6', 'e7'] as const) {
      const fen = transformFen(king === 'e6'
        ? '8/2kB4/4K3/8/8/3N4/8/8 w - - 0 1'
        : '8/2kBK3/8/8/8/3N4/8/8 w - - 0 1', transform)
      const board = getChess(fen)
      const knight = board.move({from: transformSquare('d3', transform), to: transformSquare('f4', transform)}).san
      assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: 1})
      assert.ok(getIdealKnightAndBishopWhiteMoves(fen).includes(knight))
      board.move({from: transformSquare('c7', transform), to: transformSquare('b6', transform)})
      board.move({from: transformSquare(king, transform), to: transformSquare('d6', transform)})
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
    }
  }
})


test('Nd3 and a king on rank five or above strictly right of Black support the seven-diagonal after White moves', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/4K3/1k6/8/2B5/3N4/8/8 w - - 2 2', transform)
    const move = getChess(fen).move({from: transformSquare('e7', transform), to: transformSquare('d6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).supportedDiagonalSizeScore, 7)
    for (const king of ['c5', 'd6', 'e5'] as const) {
      const board = getChess('8/8/1k6/8/2B5/3N4/8/7K b - - 0 1')
      board.remove('h1')
      board.put({color: 'w', type: 'k'}, king)
      assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)), {size: 7, knight: 0})
    }
    for (const unsupported of [
      '1K6/8/1k6/8/2B5/3N4/8/8 b - - 0 1', // Same file as Black.
      'K7/8/1k6/8/2B5/3N4/8/8 b - - 0 1', // Left of Black.
      '8/8/1k6/8/2BK4/3N4/8/8 b - - 0 1', // Below rank five.
      '8/8/1k1K4/8/2B2N2/8/8/8 b - - 0 1', // Knight approaching support is not enough for this branch.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(unsupported, transform)).size, 99)
  }
})


test('a distant Be8 remains eligible with Nd3 or Nd5', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('1k2B3/8/3K4/8/8/3N4/8/8 b - - 0 1', transform)).size, 5)
    assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen('1k2B3/8/8/2KN4/8/8/8/8 b - - 0 1', transform)), {size: 5, knight: 0})
  }
})


test('Ba4 and Nd3 support five-diagonals near d6 unless Black occupies the excluded upper squares', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/2k5/4K3/8/8/1B1N4/8/8 w - - 2 2', transform)
    const move = getChess(before).move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    for (const king of ['c5', 'd5', 'e5', 'c6', 'd6', 'e6', 'c7', 'd7', 'e7'] as const) {
      const board = getChess('k7/8/8/8/B7/3N4/8/7K b - - 0 1')
      board.remove('h1')
      board.put({color: 'w', type: 'k'}, king)
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, 5)
    }
    // d8 is inside the cage; the other excluded squares are on or outside its boundary.
    for (const black of ['d8', 'e8', 'e7', 'f8'] as const) {
      const board = getChess('k7/8/8/2K5/B7/3N4/8/8 b - - 0 1')
      board.remove('a8')
      board.put({color: 'b', type: 'k'}, black)
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, 99)
    }
  }
})


test('Ba4 supports the five-diagonal when Black cannot legally reach its six-diagonal', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('3k4/8/5K2/8/8/1B1N4/8/8 w - - 2 2', transform)
    const move = getChess(before).move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    for (const knight of ['d3', 'f4'] as const) {
      const board = getChess('k7/8/5K2/8/B7/3N4/8/8 b - - 0 1')
      board.remove('d3')
      board.put({color:'w', type:'n'}, knight)
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, 5)
    }
    const escape = transformFen('3k4/8/7K/8/B7/3N4/8/8 b - - 0 1', transform)
    assert.ok(getChess(escape).moves({verbose:true}).some(move => move.to === transformSquare('e7', transform)))
    assert.equal(knightAndBishopSupportedDiagonal(escape).size, 99)
  }
})


test('a legal attack on Ba4 via a5 invalidates five support unless the knight is on d3', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/1k6/4K3/BN6/8/8/8 w - - 0 1', transform)
    const board = getChess(fen)
    const move = board.move({from: transformSquare('e5', transform), to: transformSquare('d4', transform)}).san
    assert.ok(board.moves({verbose:true}).some(reply => reply.to === transformSquare('a5', transform)))
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).supportedDiagonalSizeScore, 99)
    const held = transformFen('8/8/1k6/8/B2K4/3N4/8/8 b - - 0 1', transform)
    assert.equal(knightAndBishopSupportedDiagonal(held).size, 5)
    const distant = transformFen('1k6/8/3K4/8/BN6/8/8/8 b - - 0 1', transform)
    assert.equal(knightAndBishopSupportedDiagonal(distant).size, 5)
  }
})


test('winning the six-diagonal races supports an approaching knight without White occupying the diagonal', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/k7/8/4K3/B7/3N4/8/8 w - - 0 1', transform)
    const board = getChess(before)
    const knight = board.move({from: transformSquare('d3', transform), to: transformSquare('f4', transform)}).san
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [knight])
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('8/k7/8/8/B3KN2/8/8/8 b - - 0 1', transform)).size, 5)
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('8/k7/3K4/8/B4N2/8/8/8 b - - 0 1', transform)).size, 5)
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('8/k7/8/4K3/B7/3N4/8/8 b - - 0 1', transform)).size, 5)
  }
})


test('six-diagonal races support Ba4 with an approaching knight despite the b6 reply', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/k3K3/8/8/B7/3N4/8/8 w - - 0 1', transform)
    const board = getChess(before)
    const knight = board.move({from: transformSquare('d3', transform), to: transformSquare('f4', transform)}).san
    assert.ok(board.moves({verbose:true}).some(move => move.to === transformSquare('b6', transform)))
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [knight])
    const controlled = transformFen('8/k7/3K4/8/B4N2/8/8/8 b - - 0 1', transform)
    assert.ok(getChess(controlled).moves({verbose:true}).some(move => move.to === transformSquare('b6', transform)))
    assert.equal(knightAndBishopSupportedDiagonal(controlled).size, 5)
    const distant = transformFen('k7/4K3/8/8/B4N2/8/8/8 b - - 0 1', transform)
    assert.equal(knightAndBishopSupportedDiagonal(distant).size, 5)
  }
})


test('Ba4 Nd3 Ke6 supports five-diagonals with Black on the wall except e8, f8 and g8', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/8/2k1K3/8/8/1B1N4/8/8 w - - 0 1', transform)
    const move = getChess(before).move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    for (const black of ['e8', 'f8', 'g8'] as const) {
      const board = getChess('k7/8/4K3/8/B7/3N4/8/8 b - - 0 1')
      board.remove('a8'); board.put({color:'b', type:'k'}, black)
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, 99)
    }
    const wrongKing = transformFen('8/8/2k2K2/8/B7/3N4/8/8 b - - 0 1', transform)
    assert.equal(knightAndBishopSupportedDiagonal(wrongKing).size, 99)
    const wrongKnight = transformFen('8/8/2k1K3/8/B7/8/4N3/8 b - - 0 1', transform)
    assert.equal(knightAndBishopSupportedDiagonal(wrongKnight).size, 99)
  }
})


test('five-diagonal support rejects Kd8 allowing Kc5 while Nd3 and Kd6 prevent it', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('4B3/4K3/1k6/8/5N2/8/8/8 w - - 0 1', transform)
    const board = getChess(fen)
    const king = board.move({from: transformSquare('e7', transform), to: transformSquare('d8', transform)}).san
    assert.ok(board.moves({verbose:true}).some(move => move.to === transformSquare('c5', transform)))
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(fen, king)?.id, 'r1.5')
    const knight = getChess(fen).move({from: transformSquare('f4', transform), to: transformSquare('d3', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, knight).supportedDiagonalSizeScore, 5)
    const defended = getChess(fen).move({from: transformSquare('e7', transform), to: transformSquare('d6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, defended).supportedDiagonalSizeScore, 5)
  }
})


test('Nd3 supports a five-diagonal near e7 only with no immediate six- or seven-diagonal escape', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const loop = getChess(transformFen('4B3/8/4K3/8/2k5/3N4/8/8 w - - 0 1', transform))
    loop.move({from: transformSquare('e8', transform), to: transformSquare('g6', transform)})
    loop.move({from: transformSquare('c4', transform), to: transformSquare('b5', transform)})
    const beforeReturn = loop.fen()
    const returning = loop.move({from: transformSquare('g6', transform), to: transformSquare('e8', transform)}).san
    assert.equal(knightAndBishopSupportedDiagonal(loop.fen()).size, 99)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(beforeReturn).includes(returning))
    const supported = transformFen('1k6/5K2/8/1B6/8/3N4/8/8 b - - 0 1', transform)
    assert.equal(knightAndBishopSupportedDiagonal(supported).size, 5)
    for (const [fen, escape] of [
      ['4BK2/2k5/8/8/8/3N4/8/8 b - - 0 1', 'd6'],
      ['8/8/2BK4/1k6/8/3N4/8/8 b - - 0 1', 'c4'],
    ] as const) {
      const position = transformFen(fen, transform)
      assert.ok(getChess(position).moves({verbose: true}).some(move => move.to === transformSquare(escape, transform)))
      assert.equal(knightAndBishopSupportedDiagonal(position).size, 99)
    }
    const farKing = transformFen('1k6/8/2B3K1/8/8/3N4/8/8 b - - 0 1', transform)
    assert.equal(knightAndBishopSupportedDiagonal(farKing).size, 99)
  }
})


test('Nd3 allows tied e7 races with Ba4 or Bb5 and requires White closer with the other five-diagonal bishops', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/8/1k6/1B6/2K5/3N4/8/8 w - - 0 1', transform)
    const board = getChess(before)
    board.move({from: transformSquare('c4', transform), to: transformSquare('b4', transform)})
    for (const square of ['d6', 'e7', 'f8'] as const) {
      const target = transformSquare(square, transform)
      assert.equal(kingDistance(transformSquare('b4', transform), target), kingDistance(transformSquare('b6', transform), target))
    }
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
    const knightMove = getChess(before).move({from: transformSquare('d3', transform), to: transformSquare('f4', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [knightMove])
    for (const square of ['a4', 'b5', 'c6', 'd7', 'e8'] as const) {
      const tied = getChess('8/8/1k6/8/1K6/3N4/8/8 b - - 0 1')
      tied.put({type: 'b', color: 'w'}, square)
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(tied.fen(), transform)).size,
        square === 'a4' || square === 'b5' ? 5 : 99, `${square}: ${transform.name}`)
    }
    const loaded = transformFen('8/8/8/k7/B7/2KN4/8/8 w - - 0 1', transform)
    const bishopMove = getChess(loaded).move({from: transformSquare('a4', transform), to: transformSquare('d7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(loaded, bishopMove).supportedDiagonalSizeScore, 99)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(loaded).includes(bishopMove))
    // Kc4 reaches e7 in three steps, before Black on a5 (four).
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('8/3B4/8/k7/2K5/3N4/8/8 b - - 0 1', transform)).size, 5)
    const late = transformFen('8/8/1k6/1B6/8/K2N4/8/8 b - - 0 1', transform)
    assert.equal(knightAndBishopSupportedDiagonal(late).size, 99)
    const wrongBishop = transformFen('8/8/1kB5/8/1K6/3N4/8/8 b - - 0 1', transform)
    assert.equal(knightAndBishopSupportedDiagonal(wrongBishop).size, 99)
  }
})


test('Nf4 supports the five-diagonal when White controls d6 and Black is at least two steps from b6 and e7', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('2k5/8/3K4/1B6/8/3N4/8/8 w - - 2 2', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('d3', transform), to: transformSquare('f4', transform)}).san
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: 1})
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    for (const fen of [
      '2k5/8/3K4/1B6/5N2/8/8/8 b - - 0 1', // Occupies d6; Black is exactly two steps from both gates.
      '2k5/8/8/1B1K4/5N2/8/8/8 b - - 0 1', // Controls d6 from d5.
      '1k6/8/2B1K3/8/5N2/8/8/8 b - - 0 1', // Controls d6 from e6.
      'k7/4K3/8/1B6/5N2/8/8/8 b - - 0 1', // Controls d6 without defending the bishop.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
    for (const fen of [
      '2k5/8/8/1B6/4KN2/8/8/8 b - - 0 1', // White does not control d6.
      '2k5/8/3K4/1B6/8/8/4N3/8 b - - 0 1', // Knight is not one move from d5.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
  }
})


test('Nd3 permits an undefended Bd7 exactly three king steps from Black', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const defendedBefore = transformFen('8/8/3K4/k7/B7/3N4/8/8 w - - 0 1', transform)
    const move = getChess(defendedBefore).move({from: transformSquare('a4', transform), to: transformSquare('d7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(defendedBefore, move).supportedDiagonalSizeScore, 5)
    for (const [fen, expected] of [
      ['8/3B4/8/k2K4/8/3N4/8/8 b - - 0 1', 5], // Bd7 is undefended but three steps from a5.
      ['8/3B4/1k6/3K4/8/3N4/8/8 b - - 0 1', 99], // Two steps from b6 and undefended.
      ['8/3B4/1k1K4/8/8/3N4/8/8 b - - 0 1', 5], // Two steps from b6, defended by Kd6.
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, expected)
  }
})

test('a knight one move from seven support qualifies when White wins the bishop and opposite-side races', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, expected] of [
      ['8/k7/8/3BK3/8/8/5N2/8 b - - 0 1', 7], // Black is exactly two steps from c5.
      ['8/8/1k6/3BK3/8/8/5N2/8 b - - 0 1', 99], // Only one step from c5.
      ['8/k7/8/3B4/6K1/8/5N2/8 b - - 0 1', 99], // Equal distances to the bishop.
      ['3k4/8/8/3B4/3K4/8/5N2/8 b - - 0 1', 99], // Tied races to f6 and g7.
      ['8/k7/8/3BK3/4N3/8/8/8 b - - 0 1', 99], // Knight still two moves from d3.
    ] as const) {
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, expected, `${fen}: ${transform.name}`)
    }
    const before = transformFen('8/k7/8/3BK3/4N3/8/8/8 w - - 0 1', transform)
    const move = (to: 'f2' | 'g3') => getChess(before).move({from: transformSquare('e4', transform), to: transformSquare(to, transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move('f2')).supportedDiagonalSizeScore, 7)
    assert.equal(scoreKnightAndBishopWhiteMove(before, move('g3')).supportedDiagonalSizeScore, 7)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move('g3')])
  }
})

test('within one move of support includes the occupied square and makes Bb3 preferred', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const knight of ['d3', 'f2'] as const) {
      const board = getChess('8/8/8/k7/2B5/2K5/8/8 b - - 0 1')
      board.put({type: 'n', color: 'w'}, knight)
      assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)),
        {size: 7, knight: knight === 'd3' ? 0 : 1})
    }
    const before = transformFen('8/8/8/k7/2B5/2KN4/8/8 w - - 0 1', transform)
    const bishop = getChess(before).move({from: transformSquare('c4', transform), to: transformSquare('b3', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [bishop])
  }
})

test('a king on the five-diagonal midpoint cannot support a bishop adjacent to Black', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/8/k1K5/3N4/B7/8/8/8 w - - 16 9', transform)
    const board = getChess(before)
    board.move({from: transformSquare('a4', transform), to: transformSquare('b5', transform)})
    assert.notEqual(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
    for (const fen of [
      '8/8/k7/1BKN4/8/8/8/8 b - - 17 9', // King away from c6.
      'k7/8/2K5/1B1N4/8/8/8/8 b - - 17 9', // Black no longer adjacent to the bishop.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
  }
})

test('Nd5 inherits Nd3 eligibility when White wins or ties the c5 race', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const king of ['c7', 'd7'] as const) {
      const board = getChess('8/8/k7/8/B7/3N4/8/7K b - - 0 1')
      board.remove('h1')
      board.put({type: 'k', color: 'w'}, king)
      const original = transformFen(board.fen(), transform)
      assert.equal(knightAndBishopSupportedDiagonal(original).size, 5)
      board.remove('d3')
      board.put({type: 'n', color: 'w'}, 'd5')
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, 5)
    }
    const before = transformFen('8/8/k1K5/3N4/B7/8/8/8 w - - 16 9', transform)
    const move = (from: 'c6' | 'a4', to: 'c7' | 'b5') => getChess(before).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move('c6', 'c7')).supportedDiagonalSizeScore, 5)
    assert.equal(scoreKnightAndBishopWhiteMove(before, move('a4', 'b5')).supportedDiagonalSizeScore, 99)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(before).includes(move('a4', 'b5')))
  }
})

test('a knight within one move of d5 supports the five-diagonal when White wins or ties every six-diagonal race', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('3k4/3B4/4K3/8/5N2/8/8/8 w - - 2 2', transform)
    const board = getChess(before)
    const bishop = board.move({from: transformSquare('d7', transform), to: transformSquare('b5', transform)}).san
    for (const square of ['a3', 'b4', 'c5', 'd6', 'e7', 'f8'] as const) {
      const target = transformSquare(square, transform)
      assert.ok(kingDistance(transformSquare('e6', transform), target) <= kingDistance(transformSquare('d8', transform), target))
    }
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: 1})
    const bishopScore = scoreKnightAndBishopWhiteMove(before, bishop)
    const retreat = getChess(before).move({from: transformSquare('f4', transform), to: transformSquare('d3', transform)}).san
    assert.ok(bishopScore.supportedDiagonalKnightScore < scoreKnightAndBishopWhiteMove(before, retreat).supportedDiagonalKnightScore)
    for (const supported of [
      '8/1k6/3K4/1B6/5N2/8/8/8 b - - 0 1', // Bishop need not be on the edge.
      'k3K3/3B4/8/8/5N2/8/8/8 b - - 0 1', // Winning the races does not require immediate d6 control.
      '3k4/8/3K4/1B6/5N2/8/8/8 b - - 0 1', // Black may be one step from e7 when White ties the race.
    ]) assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(supported, transform)), {size: 5, knight: 1})
    for (const unsupported of [
      '3k4/8/6K1/1B6/5N2/8/8/8 b - - 0 1', // White loses the race to a3.
      '3k4/8/4K3/1B6/8/8/8/7N b - - 0 1', // Knight is more than one move from d5.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(unsupported, transform)).size, 99)
  }
})
