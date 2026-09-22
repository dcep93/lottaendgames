import assert from 'node:assert/strict'
import test from 'node:test'
import { allSquares, getChess, kingDistance, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { knightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight'

const sixDiagonal = ['a3', 'b4', 'c5', 'd6', 'e7', 'f8'] as const

test('Bd7 Nd3 nearby-king eligibility keeps other support checks and prefers loaded Kd6', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '42 22']) {
      const before = transformFen(`8/3B4/1k6/3K4/8/3N4/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('d5', transform), to: transformSquare('d6', transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    }
    // Newly eligible king placements; classification uses the post-White board.
    for (const fen of [
      '8/2kB4/4K3/8/8/3N4/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
    for (const fen of [
      // Nearby kings no longer suffice when the bishop is remote.
      '8/k2B4/8/1K6/8/3N4/8/8 b - - 0 1',
      // Three steps apart, outside the prior king-placement list.
      '8/k2B4/8/8/1K6/3N4/8/8 b - - 0 1',
      // Two steps apart cannot rescue a bishop Black can capture immediately.
      '8/2kB4/8/4K3/8/3N4/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
  }
})

test('declared second-move Bd7 with Kd5 Nd3 against Ka5 is superseded by the bishop-adjacency requirement', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '42 22']) {
      const board = getChess(transformFen(`8/8/1k6/3K4/8/1B1N4/8/8 w - - ${counters}`, transform))
      board.move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)})
      board.move({from: transformSquare('b6', transform), to: transformSquare('a5', transform)})
      const before = board.fen()
      const move = board.move({from: transformSquare('a4', transform), to: transformSquare('d7', transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
      assert.ok(!getIdealKnightAndBishopWhiteMoves(before).includes(move))
    }
    for (const nearby of [
      '8/3B4/8/3K4/8/3N4/8/k7 b - - 0 1',
      '8/3B4/8/k7/3K4/3N4/8/8 b - - 0 1',
    ]) assert.notEqual(knightAndBishopSupportedDiagonal(transformFen(nearby, transform)).size, 5)
  }
})

test('declared Ba4 with Kd5 Nd3 against Kb6 is supported and preferred', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '42 22']) {
      const before = transformFen(`8/8/1k6/3K4/8/1B1N4/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    }
    for (const nearby of [
      '8/1k6/8/3K4/B7/3N4/8/8 b - - 0 1',
      '8/8/1k6/3K4/8/3N4/B7/8 b - - 0 1',
    ]) assert.notEqual(knightAndBishopSupportedDiagonal(transformFen(nearby, transform)).size, 5)
  }
})

test('Ba4 with Kd6 Nd3 is supported across Black placements and breaks the loaded shuttles', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '42 22']) {
      const before = transformFen(`8/1k6/3K4/8/8/1B1N4/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const ba4 = board.move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
      assert.equal(scoreKnightAndBishopWhiteMove(before, ba4).supportedDiagonalSizeScore, 5)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [ba4])
    }
    for (const fen of [
      'k7/8/3K4/8/B7/3N4/8/8 b - - 0 1',
      '8/k7/3K4/8/B7/3N4/8/8 b - - 0 1',
      '8/8/1k1K4/8/B7/3N4/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('8/1k6/8/3K4/B7/3N4/8/8 b - - 0 1', transform)).size, 99)
    const loaded = transformFen('8/8/1k1K4/8/8/1B1N4/8/8 w - - 0 1', transform)
    const ba4 = getChess(loaded).move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(loaded), [ba4])
  }
})

test('Kd6 supports Bd7 with Nd3 and breaks the loaded Ba4–Bb3 shuttle', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '38 20']) {
      const fen = transformFen(`8/8/3K4/k7/B7/3N4/8/8 w - - ${counters}`, transform)
      const board = getChess(fen)
      const bd7 = board.move({from: transformSquare('a4', transform), to: transformSquare('d7', transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
      assert.equal(scoreKnightAndBishopWhiteMove(fen, bd7).supportedDiagonalSizeScore, 5)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [bd7])
    }
  }
})

test('Nd3 five support combines right-side kings with declared placements or nearby Bd7 kings', () => {
  for (const bishop of ['a4', 'b5', 'c6', 'd7'] as const) {
    for (const king of allSquares()) {
      if (king === bishop || king === 'd3' || kingDistance(king, 'a7') <= 1) continue
      const board = getChess('8/k7/8/8/8/3N4/8/7K b - - 0 1')
      board.remove('h1')
      board.put({type: 'k', color: 'w'}, king)
      board.put({type: 'b', color: 'w'}, bishop)
      for (const transform of SQUARE_TRANSFORMS) {
        assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size,
          king[0] > 'a' && (bishop === 'a4' || kingDistance(king, bishop) === 1) && ((['a4', 'd7'].includes(bishop) && ['c5', 'c6', 'c7'].includes(king)) || (['a4', 'd7'].includes(bishop) && king === 'd6') || (bishop === 'd7' && kingDistance(king, 'a7') <= 2)) ? 5 : 99, `${king}, ${bishop}, ${transform.name}`)
      }
    }
  }
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('2K5/k7/8/8/B7/3N4/8/8 w - - 0 1', transform)
    const move = getChess(before).move({from: transformSquare('c8', transform), to: transformSquare('c7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
    const loaded = transformFen('3K4/8/8/k7/B7/3N4/8/8 w - - 0 1', transform)
    const be8 = getChess(loaded).move({from: transformSquare('a4', transform), to: transformSquare('e8', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(loaded, be8).supportedDiagonalSizeScore, 5)
  }
})

test('Ba4 ends the loaded seven-diagonal shuttle through supported five-diagonal progress', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/k7/2K5/8/1B1N4/8/8 w - - 0 1', transform)
    const ba4 = getChess(fen).move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, ba4).supportedDiagonalSizeScore, 5)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [ba4])
  }
})

test('declared Bb1 with Kd3 Nc4 against Kd1 is unsupported only in its exact placement', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '43 27']) {
      const before = transformFen(`8/8/8/8/2N5/3K4/B7/3k4 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('a2', transform), to: transformSquare('b1', transform)}).san
      assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 99, knight: 99})
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    }
    for (const nearby of [
      '8/8/8/8/2N5/3K4/8/1B2k3 b - - 1 1',
      '8/8/8/8/2N5/4K3/8/1B1k4 b - - 1 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(nearby, transform)).size, 7)
  }
})

test('an approaching seven knight must leave c3 and d4 covered by the king races', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/5B2/4K3/1k2N3/8/8/8/8 w - - 0 1', transform)
    const move = getChess(before).move({from: transformSquare('e6', transform), to: transformSquare('e7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(before).includes(move))
    // The established support knight closes that side even with the king farther away.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen(
      '8/4KB2/8/1k6/8/3N4/8/8 b - - 1 1', transform)).size, 7)
  }
})

test('Be8 with Nb4 loses the tied e7 race to a bishop attack, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/5B2/8/k7/1N6/1K6/8/8 w - - 0 1', transform)
    const be8 = getChess(before).move({from: transformSquare('f7', transform), to: transformSquare('e8', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, be8).supportedDiagonalSizeScore, 99)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(before).includes(be8))
    for (const allowed of [
      // White reaches e7 one step sooner, covering the attack tempo.
      '4B3/8/8/k7/1NK5/8/8/8 b - - 0 1',
      // A knight already on d5 retains its own support conditions.
      '4B3/8/8/k2N4/8/1K6/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(allowed, transform)).size, 5, allowed)
  }
})

test('Kb5 Bc8 Nc6 against Ka7 is unsupported by exact placement, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('2B5/k7/8/NK6/8/8/8/8 w - - 0 1', transform)
    const nc6 = getChess(before).move({from: transformSquare('a5', transform), to: transformSquare('c6', transform)}).san
    const kc6 = getChess(before).move({from: transformSquare('b5', transform), to: transformSquare('c6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, nc6).supportedDiagonalSizeScore, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(before, kc6).supportedDiagonalSizeScore, 99)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(before).includes(nc6))
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('2B5/k7/2N5/1K6/8/8/8/8 b - - 73 42', transform)).size, 99)
    // Changing Black's square cannot restore a target with Kb5.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('k1B5/8/2N5/1K6/8/8/8/8 b - - 0 1', transform)).size, 99)
  }
})

test('Nd5 with Kd4 Bc6 against Ka5 is unsupported despite its former exact placement, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/8/2B5/k7/1N1K4/8/8/8 w - - 0 1', transform)
    const nd5 = getChess(before).move({from: transformSquare('b4', transform), to: transformSquare('d5', transform)}).san
    const score = scoreKnightAndBishopWhiteMove(before, nd5)
    assert.equal(score.supportedDiagonalSizeScore, 99)
    assert.equal(score.supportedDiagonalKnightScore, 99)
    const after = transformFen('8/8/2B5/k2N4/3K4/8/8/8 b - - 73 42', transform)
    assert.deepEqual(knightAndBishopSupportedDiagonal(after), {size: 99, knight: 99})
    assert.throws(() => knightAndBishopSupportedDiagonal(after.replace(' b ', ' w ')))
    for (const nearby of [
      '8/8/2B5/k2N4/4K3/8/8/8 b - - 0 1',
      '8/8/k1B5/3N4/3K4/8/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(nearby, transform)).size, 99, nearby)
  }
})

test('Kd4 Bc6 Nb4 against Kb6 is unsupported despite its former exact placement, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/8/1kB5/8/1NK5/8/8/8 w - - 2 2', transform)
    const kd4 = getChess(before).move({from: transformSquare('c4', transform), to: transformSquare('d4', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, kd4).supportedDiagonalSizeScore, 99)
    const after = transformFen('8/8/1kB5/8/1N1K4/8/8/8 b - - 73 42', transform)
    assert.deepEqual(knightAndBishopSupportedDiagonal(after), {size: 99, knight: 99})
    assert.throws(() => knightAndBishopSupportedDiagonal(after.replace(' b ', ' w ')))
    for (const nearby of [
      '8/8/1kB5/8/1N2K3/8/8/8 b - - 0 1',
      '8/8/2B5/1k6/1N1K4/8/8/8 b - - 0 1',
      '8/8/1kB5/8/3K4/2N5/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(nearby, transform)).size, 99, nearby)
  }
})

test('Ke7 Bc6 Nb4 against Kc7 is unsupported despite its former exact placement, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('4K3/2k5/2B5/8/1N6/8/8/8 w - - 2 2', transform)
    const ke7 = getChess(before).move({from: transformSquare('e8', transform), to: transformSquare('e7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, ke7).supportedDiagonalSizeScore, 99)
    assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen('8/2k1K3/2B5/8/1N6/8/8/8 b - - 73 42', transform)), {size: 99, knight: 99})
    // Nearby king placements retain the knight-only defense restriction.
    for (const fen of [
      '4K3/2k5/2B5/8/1N6/8/8/8 b - - 0 1',
      '8/2k2K2/2B5/8/1N6/8/8/8 b - - 0 1',
      '8/1k2K3/2B5/8/1N6/8/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
  }
})

test('Ba6 loses a tied b6 race when Black attacks before the king can defend, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('k7/3K4/8/8/1NB5/8/8/8 w - - 0 1', transform)
    const ba6 = getChess(before).move({from: transformSquare('c4', transform), to: transformSquare('a6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, ba6).supportedDiagonalSizeScore, 99)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(before).includes(ba6))
    for (const allowed of [
      // Nd5 already controls b6, so White need not race there.
      'k7/3K4/B7/3N4/8/8/8/8 b - - 0 1',
      // The bishop is already defended by the king.
      'k7/8/BK6/8/1N6/8/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(allowed, transform)).size, 3, allowed)
  }
})

test('a shortest-route bishop attack breaks a tied d6 race if the king cannot defend in time', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('6K1/k7/8/8/2B5/3N4/8/8 w - - 0 1', transform)
    const bb5 = getChess(before).move({from: transformSquare('c4', transform), to: transformSquare('b5', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, bb5).supportedDiagonalSizeScore, 99)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(before).includes(bb5))
    for (const [position, expected] of [
      // A better race no longer suffices with Nd3 and a king outside c5/c6/c7.
      ['8/k4K2/8/1B6/8/3N4/8/8 b - - 0 1', 99],
      // Being able to defend Bb5 also does not waive the Ba4/Bd7 and c5/c6/c7 requirement.
      ['8/k7/8/1B6/8/1K1N4/8/8 b - - 0 1', 99],
      // A five-knight retains its separate support conditions.
      ['8/k7/8/1BKN4/8/8/8/8 b - - 0 1', 5],
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(position, transform)).size, expected, position)
  }
})

test('a bishop attack on Black’s shortest e7 route adds one step to the Nd3 king race', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('k7/8/4B3/8/8/1K1N4/8/8 w - - 0 1', transform)
    const bd7 = getChess(before).move({from: transformSquare('e6', transform), to: transformSquare('d7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, bd7).supportedDiagonalSizeScore, 99)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(before).includes(bd7))
    for (const [position, expected] of [
      // Paying the e7 attack tempo no longer suffices with Nd3 and a king outside c5/c6/c7.
      ['k7/3B4/8/8/1K6/3N4/8/8 b - - 0 1', 99],
      // Being closer to Bb5 does not waive the Ba4/Bd7 and c5/c6/c7 requirement either.
      ['k7/8/8/1B6/8/1K1N4/8/8 b - - 0 1', 99],
      // A five-knight has its own support conditions.
      ['k7/3B4/8/1K1N4/8/8/8/8 b - - 0 1', 5],
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(position, transform)).size, expected)
  }
})

test('Bc8 cannot support a three-diagonal with Nb6 or Nc7, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      '2B5/k7/1N6/1K6/8/8/8/8 b - - 0 1',
      '2B5/k1N5/8/1K6/8/8/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
    const before = transformFen('8/k2B4/1N6/1K6/8/8/8/8 w - - 0 1', transform)
    const bc8 = getChess(before).move({from: transformSquare('d7', transform), to: transformSquare('c8', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, bc8).supportedDiagonalSizeScore, 99)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(before).includes(bc8))
    // The restriction does not exclude every knight location with this bishop.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('2B5/k7/8/1K1N4/8/8/8/8 b - - 0 1', transform)).size, 3)
  }
})

test('seven-diagonal support requires the king to match both opposite-side escape races', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/2k5/8/8/1B1N4/1K6/8 w - - 4 3', transform)
    const san = (to: 'a3' | 'c3') => getChess(fen).move({
      from: transformSquare('b2', transform), to: transformSquare(to, transform),
    }).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san('a3')).supportedDiagonalSizeScore, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san('c3')).supportedDiagonalSizeScore, 7)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san('c3')])
  }
})

test('the knight cannot occupy the only three-diagonal square adjacent to White king', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('k1B5/8/N7/K7/8/8/8/8 w - - 0 1', transform)
    const kb5 = getChess(fen).move({from: transformSquare('a5', transform), to: transformSquare('b5', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, kb5).supportedDiagonalSizeScore, 99)
    // An edge knight now disqualifies even this otherwise usable adjacent square.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('k1B5/8/NK6/8/8/8/8/8 b - - 0 1', transform)).size, 99)
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('k1B5/8/8/1K1N4/8/8/8/8 b - - 0 1', transform)).size, 3)
  }
})

test('a bishop-attack response must preserve the bishop as well as close the escape diagonal', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('1k6/1N6/B1K5/8/8/8/8/8 w - - 6 4', transform)
    const board = getChess(fen)
    const kd7 = board.move({from: transformSquare('c6', transform), to: transformSquare('d7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, kd7).supportedDiagonalSizeScore, 99)
    board.move({from: transformSquare('b8', transform), to: transformSquare('a7', transform)})
    board.move({from: transformSquare('d7', transform), to: transformSquare('c7', transform)})
    const boundary = (['a5', 'b6', 'c7', 'd8'] as const).map(square => transformSquare(square, transform))
    const replies = board.moves({verbose: true})
    assert.ok(replies.every(reply => !boundary.includes(reply.to)))
    assert.ok(replies.some(reply => reply.to === transformSquare('a6', transform) && reply.captured === 'b'))
    assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(kd7))
  }
})

test('support requires the seven knight in place while smaller diagonals may use previous-stage or approaching knights', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, size, distance] of [
      ['k1B5/3K4/8/3N4/8/8/8/8 b - - 0 1', 3, 99], // Kd7 has no target; d5 still provides previous-stage support.
      ['k1B5/2K5/8/1N6/8/8/8/8 b - - 0 1', 3, 0],
      ['k1B5/2K5/8/8/3N4/8/8/8 b - - 0 1', 3, 1],
      ['k7/2K5/8/8/B7/3N4/8/8 b - - 0 1', 5, 2],
      ['3k2K1/8/2B5/3N4/8/8/8/8 b - - 0 1', 99, 99],
      ['8/8/k7/2K5/B4N2/8/8/8 b - - 0 1', 5, 1],
      ['3k2K1/8/8/3B4/8/3N4/8/8 b - - 0 1', 7, 0],
      ['3k2K1/8/8/3B4/8/8/5N2/8 b - - 0 1', 99, 99],
    ] as const) assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(fen, transform)), {size, knight: distance}, `${fen}: ${transform.name}`)
    for (const fen of [
      'k7/8/2B5/8/8/8/7N/7K b - - 0 1',
      'k7/8/8/3B4/8/8/7N/7K b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
    // The three-diagonal king-support exception allows even a remote knight.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('k1B5/2K5/8/8/8/8/6N1/8 b - - 0 1', transform)).size, 3)
  }
})

test('the bishop must lie on the diagonal and Black must be strictly inside its corner triangle', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      '7k/8/2B5/8/8/3N4/8/7K b - - 0 1',
      '8/8/2B5/1k6/8/3N4/8/7K b - - 0 1', // Black on the five-diagonal.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
  }
})

test('an immediate legal step onto the next diagonal rejects support', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, escape] of [
      ['8/3B4/1k6/8/5N2/8/8/7K b - - 0 1', 'c5'],
      ['5k2/8/8/3B4/8/3N4/8/7K b - - 0 1', 'g7'],
    ] as const) {
      const position = transformFen(fen, transform)
      assert.ok(getChess(position).moves({verbose: true}).some(move => move.to === transformSquare(escape, transform)))
      assert.equal(knightAndBishopSupportedDiagonal(position).size, 99)
    }
  }
})

test('closing the next diagonal must not sacrifice the attacked bishop', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('8/8/k3K3/8/B4N2/8/8/8 b - - 0 1', transform))
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 99, knight: 99})
    board.move({from: transformSquare('a6', transform), to: transformSquare('a5', transform)})
    assert.equal(board.isAttacked(transformSquare('a4', transform), 'w'), false)
    board.move({from: transformSquare('f4', transform), to: transformSquare('d5', transform)})
    const boundary = sixDiagonal.map(square => transformSquare(square, transform))
    assert.ok(board.moves({verbose: true}).every(move => !boundary.includes(move.to)))
    assert.ok(board.moves({verbose: true}).some(move => move.captured === 'b'))

    const safe = getChess(transformFen('8/8/k7/2K5/B4N2/8/8/8 b - - 0 1', transform))
    assert.deepEqual(knightAndBishopSupportedDiagonal(safe.fen()), {size: 5, knight: 1})
    safe.move({from: transformSquare('a6', transform), to: transformSquare('a5', transform)})
    safe.move({from: transformSquare('a4', transform), to: transformSquare('d7', transform)})
    assert.ok(safe.moves({verbose: true}).every(move => !boundary.includes(move.to) && move.captured !== 'b'))
  }
})

test('one unanswerable bishop attack rejects support even if Black initially cannot enter the next diagonal', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('1k6/8/2B5/8/5N2/8/8/K7 b - - 0 1', transform))
    const boundary = sixDiagonal.map(square => transformSquare(square, transform))
    assert.ok(board.moves({verbose: true}).every(move => !boundary.includes(move.to)))
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
    board.move({from: transformSquare('b8', transform), to: transformSquare('c7', transform)})
    assert.equal(board.isAttacked(transformSquare('c6', transform), 'w'), false)
    for (const response of board.moves()) {
      const after = getChess(board.fen())
      after.move(response)
      assert.ok(after.moves({verbose: true}).some(move => boundary.includes(move.to)))
    }
  }
})

test('Bc6 remains unsupported even when knight-defended or immediately capturable', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const defended = getChess(transformFen('1k6/8/2B1K3/8/1N6/8/8/8 b - - 0 1', transform))
    assert.deepEqual(knightAndBishopSupportedDiagonal(defended.fen()), {size: 99, knight: 99})
    defended.move({from: transformSquare('b8', transform), to: transformSquare('c7', transform)})
    assert.equal(defended.isAttacked(transformSquare('c6', transform), 'w'), true)
    const capture = transformFen('8/8/1kB5/8/8/3N4/8/7K b - - 0 1', transform)
    assert.ok(getChess(capture).moves({verbose: true}).some(move => move.captured === 'b'))
    assert.equal(knightAndBishopSupportedDiagonal(capture).size, 99)
  }
})

test('recent Nf4 and Bb5 support examples remain accepted', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, from, to] of [
      ['8/2kB4/4K3/8/8/3N4/8/8 w - - 0 1', 'd3', 'f4'],
      ['3k4/3B4/4K3/8/5N2/8/8/8 w - - 0 1', 'd7', 'b5'],
    ] as const) {
      const position = transformFen(fen, transform)
      const move = getChess(position).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
      assert.equal(scoreKnightAndBishopWhiteMove(position, move).supportedDiagonalSizeScore, 5)
    }
  }
})

test('support is evaluated after White moves and r1 still selects Bb7+', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('k1B5/2K5/8/8/8/2N5/8/8 w - - 0 1', transform)
    const move = getChess(fen).move({from: transformSquare('c8', transform), to: transformSquare('b7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).supportedDiagonalSizeScore, 3)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
  }
})


test('a seven-diagonal is unsupported when Black can step onto a square screened by White king', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/3B4/3K4/k2N4/8/8 w - - 0 1', transform)
    const screened = getChess(fen)
    const move = screened.move({from: transformSquare('d4', transform), to: transformSquare('c4', transform)}).san
    assert.ok(screened.moves({verbose: true}).some(reply => reply.to === transformSquare('a2', transform)))
    assert.equal(knightAndBishopSupportedDiagonal(screened.fen()).size, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).supportedDiagonalSizeScore, 99)
    const noEntry = transformFen('8/k7/8/3B4/2K5/3N4/8/8 b - - 0 1', transform)
    assert.equal(knightAndBishopSupportedDiagonal(noEntry).size, 7)
  }
})


test('Kd6 with Nd3 rejects Bb5 and Bc6 but permits Be8 against the a-file', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      'k7/8/3K4/1B6/8/3N4/8/8 b - - 0 1',
      'k7/8/2BK4/8/8/3N4/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('k3B3/8/3K4/8/8/3N4/8/8 b - - 0 1', transform)).size, 5)
    const fen = transformFen('8/8/8/k2B4/8/3N4/1K6/8 w - - 20 11', transform)
    const move = getChess(fen).move({from: transformSquare('d5', transform), to: transformSquare('c6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).supportedDiagonalSizeScore, 99)
    // A knight already on d5 retains the ordinary five-diagonal support conditions.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('k7/3B4/3K4/3N4/8/8/8/8 b - - 0 1', transform)).size, 5)
  }
})

test('a five-bishop with Nd3 still rejects Bb5 even with an eligible king', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/3K4/8/k7/B7/3N4/8/8 w - - 2 2', transform)
    const bc6 = getChess(before).move({from: transformSquare('a4', transform), to: transformSquare('c6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, bc6).supportedDiagonalSizeScore, 99)
    for (const king of ['c5', 'd5', 'c6', 'd6', 'c7', 'd7', 'c8', 'd8', 'b5', 'b6', 'b7', 'b8', 'c4', 'd4', 'e5', 'e6', 'e7', 'e8'] as const) {
      const board = getChess('k7/8/8/8/8/3N4/8/7K b - - 0 1')
      board.remove('h1')
      board.put({color: 'w', type: 'k'}, king)
      if (king === 'b5') continue
      board.put({color: 'w', type: 'b'}, 'b5')
      const size = knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size
      assert.notEqual(size, 5, king)
    }
  }
})

test('Bd7 remains supported but Bc6 is rejected while Kd6 is preferred with Ba4 and Nd3', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/2K5/8/k7/B7/3N4/8/8 w - - 2 2', transform)
    const bd7 = getChess(fen).move({from: transformSquare('a4', transform), to: transformSquare('d7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, bd7).supportedDiagonalSizeScore, 5)
    const loaded = transformFen('8/2K5/k7/8/B7/3N4/8/8 w - - 2 2', transform)
    const bc6 = getChess(loaded).move({from: transformSquare('a4', transform), to: transformSquare('c6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(loaded, bc6).supportedDiagonalSizeScore, 99)
    const preferred = getChess(loaded).move({from: transformSquare('c7', transform), to: transformSquare('d6', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(loaded), [preferred])
  }
})


test('the white king must be on or inside the n+2 diagonal, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [king, expected] of [['c5', 5], ['e5', 99], ['d4', 99]] as const) {
      const board = getChess('8/8/k7/3N4/B7/8/8/7K b - - 0 1')
      board.remove('h1')
      board.put({type: 'k', color: 'w'}, king)
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, expected)
    }
    const fen = transformFen('8/8/k7/8/3K4/1B1N4/8/8 w - - 0 1', transform)
    const ba4 = getChess(fen).move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)}).san
    const kc5 = getChess(fen).move({from: transformSquare('d4', transform), to: transformSquare('c5', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, ba4).supportedDiagonalSizeScore, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, kc5).supportedDiagonalSizeScore, 7)
  }
})


test('the same outer limit applies to three- and seven-diagonals', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, size] of [
      ['k2K4/8/B7/3N4/8/8/8/8 b - - 0 1', 3],
      ['k7/8/B1K5/3N4/8/8/8/8 b - - 0 1', 3],
      ['k7/8/B7/2KN4/8/8/8/8 b - - 0 1', 99],
      ['8/8/8/3B1N2/k7/8/8/K7 b - - 0 1', 7],
      ['8/8/8/3B1N2/k7/8/8/1K6 b - - 0 1', 7],
      ['8/8/8/3B1N2/k7/8/8/2K5 b - - 0 1', 99],
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, size, fen)
  }
})


test('a screened five-diagonal is unsupported when Black can walk onto it', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/2KB4/8/k2N4/8/8/8/8 w - - 0 1', transform)
    const screened = getChess(fen)
    const kc6 = screened.move({from: transformSquare('c7', transform), to: transformSquare('c6', transform)}).san
    assert.ok(screened.moves({verbose: true}).some(move => move.to === transformSquare('a4', transform)))
    assert.equal(scoreKnightAndBishopWhiteMove(fen, kc6).supportedDiagonalSizeScore, 99)
    const kd6 = getChess(fen).move({from: transformSquare('c7', transform), to: transformSquare('d6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, kd6).supportedDiagonalSizeScore, 5)
    for (const san of getIdealKnightAndBishopWhiteMoves(fen)) {
      assert.equal(scoreKnightAndBishopWhiteMove(fen, san).supportedDiagonalSizeScore, 5)
    }
  }
})


test('Be8 with Kc6 and Black Kc8 never supports a five-diagonal, regardless of the knight', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const file of 'abcdefgh') for (let rank = 1; rank <= 8; rank++) {
      const square = `${file}${rank}` as Parameters<typeof transformSquare>[0]
      if (['c6', 'e8', 'c8'].includes(square)) continue
      const board = getChess('2k1B3/8/2K5/8/8/8/8/8 b - - 0 1')
      board.put({type: 'n', color: 'w'}, square)
      assert.notEqual(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, 5, square)
    }
    const before = transformFen('2k5/5B2/2K5/3N4/8/8/8/8 w - - 2 2', transform)
    const be8 = getChess(before).move({from: transformSquare('f7', transform), to: transformSquare('e8', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, be8).supportedDiagonalSizeScore, 99)
    for (const nearby of [
      '1k2B3/8/2K5/3N4/8/8/8/8 b - - 0 1',
      '2k1B3/8/3K4/3N4/8/8/8/8 b - - 0 1',
      '2k5/3B4/2K5/3N4/8/8/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(nearby, transform)).size, 5)
  }
})

test('a five-diagonal without a five-knight requires White to match the d6 king race', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('1k6/8/K7/8/5N2/1B6/8/8 w - - 2 2', transform)
    const ba4 = getChess(fen).move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, ba4).supportedDiagonalSizeScore, 99)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(ba4))
    for (const [position, expected] of [
      ['1k6/8/K7/8/B4N2/8/8/8 b - - 0 1', 99],
      ['1k6/8/K7/3N4/B7/8/8/8 b - - 0 1', 5],
      ['1k6/8/1K6/8/B4N2/8/8/8 b - - 0 1', 5],
    ] as const) {
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(position, transform)).size, expected)
    }
  }
})

test('knight control of c5 does not waive the Nd3 Ba4/Bd7 and c5/c6/c7 requirement, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/8/1k2K3/1B6/8/3N4/8/8 w - - 2 2', transform)
    const bd7 = getChess(before).move({from: transformSquare('b5', transform), to: transformSquare('d7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, bd7).supportedDiagonalSizeScore, 99)
    const board = getChess(before)
    board.move(bd7)
    const c5 = transformSquare('c5', transform)
    assert.ok(board.isAttacked(c5, 'w'))
    assert.ok(!board.moves({verbose: true}).some(move => move.to === c5))
    // Moving the knight off d3 leaves c5 open and must still reject support.
    board.remove(transformSquare('d3', transform))
    board.put({type: 'n', color: 'w'}, transformSquare('f4', transform))
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
    // Nd3's control of c5 does not waive the separate, uncovered d6 race.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('2k5/8/K7/8/B7/3N4/8/8 b - - 0 1', transform)).size, 99)
  }
})

test('an undefended near-side five-bishop needs a king response to Kb6 with c5 uncontrolled', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const bishop of ['a4', 'b5'] as const) {
      const board = getChess('8/k7/4K3/8/5N2/8/8/8 b - - 0 1')
      board.put({type: 'b', color: 'w'}, bishop)
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, 99)
    }
    const before = transformFen('8/2k5/4K3/8/B7/3N4/8/8 w - - 0 1', transform)
    const nf4 = getChess(before).move({from: transformSquare('d3', transform), to: transformSquare('f4', transform)}).san
    const bd7 = getChess(before).move({from: transformSquare('a4', transform), to: transformSquare('d7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, nf4).supportedDiagonalSizeScore, 99)
    // Bd7/Nd3 with kings two steps apart is now eligible; the remaining checks pass.
    assert.equal(scoreKnightAndBishopWhiteMove(before, bd7).supportedDiagonalSizeScore, 5)
    for (const [allowed, expected] of [
      // The old remote-king case now fails the universal distance limit.
      ['8/k7/2B1K3/8/5N2/8/8/8 b - - 0 1', 99],
      // Kd6 already controls c5.
      ['8/k7/3K4/8/B4N2/8/8/8 b - - 0 1', 5],
      // Knight defense does not waive the universal distance limit.
      ['8/k7/2B1K3/8/1N6/8/8/8 b - - 0 1', 99],
      // From b8 Black cannot reach b6 next move.
      ['1k6/8/4K3/8/B4N2/8/8/8 b - - 0 1', 5],
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(allowed, transform)).size, expected, allowed)
  }
})

test('Kf8 with Nd3 is unsupported despite the later Ke7 defense, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('6K1/1k1B4/8/8/8/3N4/8/8 w - - 2 2', transform)
    const board = getChess(before)
    const kf8 = board.move({from: transformSquare('g8', transform), to: transformSquare('f8', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, kf8).supportedDiagonalSizeScore, 99)
    board.move({from: transformSquare('b7', transform), to: transformSquare('c7', transform)})
    assert.ok(board.moves({verbose: true}).some(move => move.piece === 'k' && move.to === transformSquare('e7', transform)))
    assert.ok(!board.moves({verbose: true}).some(move => move.piece === 'k' && move.to === transformSquare('e6', transform)))
  }
})

test('support classification requires a position after White moves', () => {
  assert.throws(() => knightAndBishopSupportedDiagonal('8/2kB4/1N6/3K4/8/8/8/8 w - - 0 1'), /after White moves/)
  const board = getChess('8/2kB4/1N6/3K4/8/8/8/8 w - - 0 1')
  board.move('Kc5')
  assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99) // Attacked Bd7 is defended only by Nb6.
  board.move('Kd8')
  assert.throws(() => knightAndBishopSupportedDiagonal(board.fen()), /after White moves/)
  board.move('Kd5')
  assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
})

test('Kb6 supports the three-diagonal even with the knight two moves from its support squares', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('k7/1N6/B7/1K6/8/8/8/8 w - - 0 1', transform)
    const kb6 = getChess(fen).move({from: transformSquare('b5', transform), to: transformSquare('b6', transform)}).san
    const score = scoreKnightAndBishopWhiteMove(fen, kb6)
    assert.equal(score.supportedDiagonalSizeScore, 3)
    assert.equal(score.supportedDiagonalKnightScore, 2)
  }
})

test('king adjacency outside b6/c7 cannot support a remote knight', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/kB6/2K5/8/8/8/8/4N3 w - - 0 1', transform)
    for (const [from, to] of [['b7', 'c8'], ['e1', 'g2']] as const) {
      const san = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
      const score = scoreKnightAndBishopWhiteMove(fen, san)
      assert.equal(score.supportedDiagonalSizeScore, 99)
      // Support-square selection remains unchanged with the king on c6.
      assert.equal(score.supportedDiagonalKnightScore, 99)
    }
    // Kd7 has no target and cannot qualify with Nb7.
    const screened = transformFen('1k6/1N6/B1K5/8/8/8/8/8 w - - 0 1', transform)
    const kd7 = getChess(screened).move({from: transformSquare('c6', transform), to: transformSquare('d7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(screened, kd7).supportedDiagonalSizeScore, 99)
  }
})

test('Bb7 with Kc6 needs the previous-stage knight when no target exists', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const knight of ['e1', 'd3', 'd5'] as const) {
      for (const black of ['a7', 'a8', 'b8'] as const) {
        const board = getChess('8/kB6/2K5/8/8/8/8/4N3 b - - 0 1')
        board.remove('e1')
        board.remove('a7')
        board.put({type: 'n', color: 'w'}, knight)
        board.put({type: 'k', color: 'b'}, black)
        assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, knight === 'd5' ? 3 : 99)
      }
    }
    // The eligible b6/c7 king placements retain their king-support allowance.
    for (const fen of ['k7/1BK5/8/8/8/8/4N3/8 b - - 0 1', 'k7/1B6/1K6/8/8/8/4N3/8 b - - 0 1']) {
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 3)
    }
  }
})

test('an already attacked bishop defended only by the knight cannot support a diagonal', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/kB6/2K5/N7/8/8/8/8 w - - 0 1', transform)
    const kb5 = getChess(fen).move({from: transformSquare('c6', transform), to: transformSquare('b5', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, kb5).pieceSafetyScore, 0)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, kb5).supportedDiagonalSizeScore, 99)
    const bc8 = getChess(fen).move({from: transformSquare('b7', transform), to: transformSquare('c8', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, bc8).supportedDiagonalSizeScore, 99)
    // The existing Kb6 placement exception remains valid with targets available.
    for (const safe of ['k1B5/8/1K1N4/8/8/8/8/8 b - - 0 1']) {
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(safe, transform)).size, 3)
    }
  }
})

test('three-diagonal targets exist at g3 but disappear at g4, in every orientation', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const king of ['g3', 'g4'] as const) {
      for (const [knight, distance] of [['e4', 2], ['c3', 1], ['d2', 1], ['e2', 0], ['f3', 0]] as const) {
        const board = getChess('8/8/8/8/8/6KB/8/7k b - - 0 1')
        board.remove('g3')
        board.put({type: 'k', color: 'w'}, king)
        board.put({type: 'n', color: 'w'}, knight)
        assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)),
          king === 'g3' ? {size: 3, knight: distance} : knight === 'e4' ? {size: 3, knight: 99} : {size: 99, knight: 99}, `${king}, ${knight}: ${transform.name}`)
      }
    }
    const fen = transformFen('8/8/8/8/4N3/6KB/8/7k w - - 2 2', transform)
    const move = (from: 'g3' | 'e4', to: 'g4' | 'c3' | 'd2') =>
      getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
    const kg4 = move('g3', 'g4')
    assert.equal(scoreKnightAndBishopWhiteMove(fen, kg4).supportedDiagonalKnightScore, 99)
    for (const to of ['c3', 'd2'] as const) {
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move('e4', to)).supportedDiagonalKnightScore, 1)
    }
    assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(kg4))
  }
})


test('a seven-knight must occupy support even when the bishop is defended or cannot be attacked', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, expected] of [
      // Kf5 permits ...Kd6; the possible Ke4 response no longer rescues support.
      ['8/4k3/8/3BNK2/8/8/8/8 b - - 3 2', 99],
      // On d3, the knight retains the existing response allowance.
      ['8/4k3/8/3B1K2/8/3N4/8/8 b - - 3 2', 7],
      // With Ke4 already defending Bd5, ...Kc5 attacks a defended bishop.
      ['8/8/3k4/3BN3/4K3/8/8/8 b - - 5 3', 99],
      // A remote Black king cannot attack the bishop next move.
      ['2k5/8/8/3BNK2/8/8/8/8 b - - 3 2', 99],
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, expected, fen)
  }
})


test('one-move knight support requires an empty destination in every orientation', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, expected] of [
      // Kd3 blocks Nb2 from reaching its seven-diagonal support square.
      ['8/8/8/8/1kB5/3K4/1N6/8 b - - 1 1', 99],
      // A vacant d3 no longer suffices: the seven knight must occupy it.
      ['8/8/8/8/2B5/k7/1NK5/8 b - - 3 2', 99],
      // Kd5 blocks Nf4 from reaching the five-diagonal support square.
      ['k7/8/8/1B1K4/5N2/8/8/8 b - - 1 1', 99],
      ['k7/8/8/1BK5/5N2/8/8/8 b - - 1 1', 5],
      // Occupation by the supporting knight itself remains valid.
      ['k7/8/8/1BKN4/8/8/8/8 b - - 1 1', 5],
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, expected, fen)
  }
})

test('Ba6 with Kc8 is unsupported in every reflection, regardless of knight placement', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const knight of ['d5', 'd3', 'e1'] as const) {
      const board = getChess('k1K5/8/B7/8/8/8/8/8 b - - 0 1')
      board.put({type: 'n', color: 'w'}, knight)
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, 99)
    }
    const fen = transformFen('k1K5/8/8/1B1N4/8/8/8/8 w - - 0 1', transform)
    const ba6 = getChess(fen).move({from: transformSquare('b5', transform), to: transformSquare('a6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, ba6).supportedDiagonalSizeScore, 99)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(ba6))
    for (const supported of ['k7/2K5/B7/3N4/8/8/8/8 b - - 0 1', 'k7/8/BK6/3N4/8/8/8/8 b - - 0 1']) {
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(supported, transform)).size, 3)
    }
  }
})


test('Kg4 Bf1 Ne2 against Kh2 is unsupported by exact placement, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/8/8/8/6K1/7B/4N2k/8 w - - 0 1', transform)
    const bf1 = getChess(before).move({from: transformSquare('h3', transform), to: transformSquare('f1', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, bf1).supportedDiagonalSizeScore, 99)
    const after = transformFen('8/8/8/8/6K1/8/4N2k/5B2 b - - 73 42', transform)
    assert.deepEqual(knightAndBishopSupportedDiagonal(after), {size: 99, knight: 99})
    for (const unsupported of [
      '8/8/8/8/6K1/7B/4N2k/8 b - - 1 1',
      '8/8/8/8/3N2K1/7B/7k/8 b - - 1 1',
      '8/8/8/8/6K1/8/4N3/5B1k b - - 1 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(unsupported, transform)).size, 99)
  }
})


test('all supported diagonals require kings within three steps after White, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('8/8/1k2B3/8/8/3N4/8/1K6 w - - 0 1', transform))
    const before = board.fen()
    const move = board.move({from: transformSquare('b1', transform), to: transformSquare('c2', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    // The three-step boundary still permits support in each diagonal family.
    for (const [fen, size] of [
      ['8/8/2k5/8/8/1BKN4/8/8 b - - 1 1', 7],
      ['k7/8/3K4/8/B7/3N4/8/8 b - - 1 1', 5],
      ['1k6/8/B7/1K1N4/8/8/8/8 b - - 1 1', 3],
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, size)
  }
})


test('an edge knight immediately disqualifies every diagonal, including declared placements and reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      '8/8/8/8/1k1K4/8/B7/2N5 b - - 1 1', // Loaded Kd4: Nc1.
      '1k6/8/B1K5/N7/8/8/8/8 b - - 0 1', // Former declared three placement.
      'k1B5/2K5/8/8/8/8/7N/8 b - - 0 1', // King support cannot waive an edge knight.
      '8/2k5/2B5/3K4/8/8/8/7N b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
    const board = getChess(transformFen('8/8/8/3K4/1k6/8/B7/2N5 w - - 0 1', transform))
    board.move({from: transformSquare('d5', transform), to: transformSquare('d4', transform)})
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
  }
})

test('a seven bishop and Black adjacent to a3 require Nd3 independently of the edge restriction', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    // Nb2 is interior and this placement passed all earlier seven-support checks.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('8/8/8/8/k7/8/BN6/K7 b - - 0 1', transform)).size, 99)
    // Occupying d3 preserves eligibility even with both bishop and Black beside a3.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('8/8/8/8/1k1K4/3N4/B7/8 b - - 0 1', transform)).size, 7)
    // The universal seven-knight requirement also applies away from a3.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('3k2K1/8/8/3B4/8/8/5N2/8 b - - 0 1', transform)).size, 99)
  }
})


test('seven support requires the matching occupied knight square in all reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    // Former Ne7+ loop: one move from reflected f5 is insufficient.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('8/4N3/2k5/8/8/3K4/B7/8 b - - 3 2', transform)).size, 99)
    // Canonical d3 and its alternate f5 orientation both retain support when occupied.
    for (const fen of [
      '8/8/8/8/1k1K4/3N4/B7/8 b - - 1 1',
      '8/8/2k5/5N2/8/3K4/B7/8 b - - 3 2',
    ]) assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(fen, transform)), {size: 7, knight: 0})
  }
})
