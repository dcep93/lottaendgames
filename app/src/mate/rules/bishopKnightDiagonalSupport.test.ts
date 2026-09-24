import assert from 'node:assert/strict'
import test from 'node:test'
import { allSquares, edgeDistance, getChess, isKnightMove, kingDistance, squareColor, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { isInsideBishopDiagonal } from './bishopKnightGeometry'
import { knightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight'

const sixDiagonal = ['a3', 'b4', 'c5', 'd6', 'e7', 'f8'] as const

test('White closer by king steps to the target corner disqualifies support across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('K5B1/8/1k6/8/8/3N4/8/8 w - - 0 1', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('a8', transform), to: transformSquare('b8', transform)}).san
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    // Both kings are three steps from a8; a tie remains eligible.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen(
      '8/8/3K4/1k6/8/1B1N4/8/8 b - - 0 1', transform)).size, 7)
  }
})

test('Nd3 with White king anywhere on the a-file is unsupported across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const king of allSquares().filter(square => square[0] === 'a')) {
      const board = getChess('6B1/8/5k2/8/8/3N4/8/7K b - - 0 1')
      board.remove('h1')
      board.put({type: 'k', color: 'w'}, king)
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, 99)
    }
    for (const [fen, from, to] of [
      ['8/8/8/8/k7/3N4/8/KB6 w - - 0 1', 'b1', 'a2'],
      ['2B5/K7/8/k7/8/3N4/8/8 w - - 0 1', 'c8', 'e6'],
    ] as const) {
      const before = transformFen(fen, transform), board = getChess(before)
      const move = board.move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    }
    assert.equal(knightAndBishopSupportedDiagonal(transformFen(
      '8/8/8/1k6/8/1B1N4/1K6/8 b - - 0 1', transform)).size, 7)
  }
})

test('ordinary support requires opposite king and bishop colors, preserving declarations across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      '6B1/1k6/8/8/4K3/3N4/8/8 b - - 0 1',
      '8/8/k7/8/2K5/1B1N4/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
    // Kb5/Ba6 was explicitly declared supported regardless of the knight.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen(
      'k7/8/B7/1K1N4/8/8/8/8 b - - 0 1', transform)).size, 3)
    // A specifically declared five-diagonal placement retains its exception.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen(
      '8/1k1K4/8/1B1N4/8/8/8/8 b - - 0 1', transform)).size, 5)
  }
})

test('seven-diagonal king on the wall below bishop is unsupported with Nd3 across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, from, to] of [
      ['8/2k5/8/3B4/8/1K1N4/8/8 w - - 0 1', 'b3', 'c4'],
      ['8/8/1k6/8/2B5/3N4/K7/8 w - - 0 1', 'a2', 'b3'],
    ] as const) {
      const before = transformFen(fen, transform), board = getChess(before)
      const move = board.move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    }
    // White above its bishop on the same wall now fails the general color rule.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen(
      '8/8/k7/8/2K5/1B1N4/8/8 b - - 0 1', transform)).size, 99)
  }
})

test('five-diagonal approaching knight must be one move from both support stages across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('3k4/8/2K5/1BN5/8/8/8/8 w - - 0 1', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('c6', transform), to: transformSquare('d6', transform)}).san
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    // The earlier exact Kd8 declaration cannot rescue a one-stage-only approach.
    for (const knight of ['c5', 'e5', 'f2'] as const) {
      const position = getChess('3k4/8/3K4/1B6/8/8/8/8 b - - 0 1')
      position.put({type: 'n', color: 'w'}, knight)
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(position.fen(), transform)).size, 99)
    }
    for (const knight of ['b4', 'f4', 'e3', 'e7'] as const) {
      const position = getChess('3k4/8/3K4/1B6/8/8/8/8 b - - 0 1')
      position.put({type: 'n', color: 'w'}, knight)
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(position.fen(), transform)).size, 5)
    }
  }
})

test('declared Bf7+ with Ke6 Nd3 versus Ke8 is unsupported only in its exact placement across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('4k1B1/8/4K3/8/8/3N4/8/8 w - - 0 1', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('g8', transform), to: transformSquare('f7', transform)}).san
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 99, knight: 99})
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    // Moving White king to f6 retains support; the declaration is not a blanket Bf7 ban.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen(
      '4k3/5B2/5K2/8/8/3N4/8/8 b - - 0 1', transform)).size, 7)
  }
})

test('seven-diagonal king below bishop remains eligible off the bishop diagonal, across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    // White below the bishop and Black above White, with Black on either side of the bishop rank.
    for (const fen of [
      '8/k4B2/8/8/3K4/3N4/8/8 b - - 0 1',
      '8/5B2/8/1k6/3K4/3N4/8/8 b - - 0 1',
      '6B1/4k1K1/8/8/8/3N4/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 7, fen)
  }
})

test('Nb7 and all D4 equivalents disqualify support even for declared king-bishop placements', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const knight of ['b2', 'b7', 'g2', 'g7'] as const) {
      const board = getChess('k7/8/BK6/8/8/8/8/8 b - - 0 1')
      board.put({type: 'n', color: 'w'}, knight)
      assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)), {size: 99, knight: 99})
    }
    // Legal preferred-entry example is now rejected regardless of the Black king square.
    const before = transformFen('1kBK4/1N6/8/8/8/8/8/8 w - - 0 1', transform)
    const move = getChess(before).move({from: transformSquare('d8', transform), to: transformSquare('d7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    // A nearby knight square retains the existing corner support.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('k7/8/BK6/8/8/2N5/8/8 b - - 0 1', transform)).size, 3)
  }
})

test('Kd6 supports a safe five-bishop with a knight one move from both support stages and no six-diagonal exit', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('8/8/3K4/k7/B7/3N4/8/8 w - - 0 1', transform))
    board.move({from: transformSquare('a4', transform), to: transformSquare('e8', transform)})
    board.move({from: transformSquare('a5', transform), to: transformSquare('b6', transform)})
    const before = board.fen()
    const move = board.move({from: transformSquare('d3', transform), to: transformSquare('f4', transform)}).san
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
    const replies = board.moves({verbose: true}).filter(m => m.piece === 'k').map(m => m.to)
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen(), replies), knightAndBishopSupportedDiagonal(board.fen()))
    // Threatening the bishop, an open boundary, a wrong knight, or Bc6 cannot use this declaration.
    for (const fen of [
      '8/8/1k1K4/8/B4N2/8/8/8 b - - 0 1',
      '4B3/8/3K4/1k6/5N2/8/8/8 b - - 0 1',
      '4B3/8/1k1K4/8/8/4N3/8/8 b - - 0 1',
      '8/8/1kBK4/8/5N2/8/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99, fen)
  }
})

test('five-diagonal with an approaching knight requires kings within two steps, across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('1k3K2/8/8/1B6/8/4N3/8/8 w - - 0 1', transform))
    const before = board.fen()
    const move = board.move({from: transformSquare('f8', transform), to: transformSquare('e7', transform)}).san
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    // At two steps, the approaching knight may still support the cage.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('3k4/8/3K4/1B6/8/4N3/8/8 b - - 0 1', transform)).size, 5)
    // An occupied seven square retains the existing remote-king declaration.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('1k6/4K3/8/1B6/8/3N4/8/8 b - - 0 1', transform)).size, 5)
  }
})

test('an off-support knight cannot support five with White level with or left of Black, even on the edge', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/8/8/k7/BN6/8/K7/8 w - - 0 1', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('a2', transform), to: transformSquare('a3', transform)}).san
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    for (const fen of [
      '8/8/k7/8/BN6/K7/8/8 b - - 0 1',
      '8/8/1k6/8/BN6/K7/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
  }
})

test('Bd7 Nd3 nearby-king eligibility keeps other support checks and prefers loaded Kd6', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '42 22']) {
      const before = transformFen(`8/3B4/1k6/3K4/8/3N4/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('d5', transform), to: transformSquare('d6', transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    }
    // Same-color king placements now fail while the knight is off current support.
    for (const fen of [
      '8/2kB4/4K3/8/8/3N4/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
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

test('declared second-move Bd7 with Kd5 Nd3 against Ka5 bypasses bishop adjacency as explicitly redeclared', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '42 22']) {
      const board = getChess(transformFen(`8/8/1k6/3K4/8/1B1N4/8/8 w - - ${counters}`, transform))
      board.move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)})
      board.move({from: transformSquare('b6', transform), to: transformSquare('a5', transform)})
      const before = board.fen()
      const move = board.move({from: transformSquare('a4', transform), to: transformSquare('d7', transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
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

test('Kd6 supports Bd7 with Nd3 and permits the preferred Be8', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '38 20']) {
      const fen = transformFen(`8/8/3K4/k7/B7/3N4/8/8 w - - ${counters}`, transform)
      const board = getChess(fen)
      const bd7 = board.move({from: transformSquare('a4', transform), to: transformSquare('d7', transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
      assert.equal(scoreKnightAndBishopWhiteMove(fen, bd7).supportedDiagonalSizeScore, 5)
      const be8 = getChess(fen).move({from: transformSquare('a4', transform), to: transformSquare('e8', transform)}).san
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [be8])
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
          (bishop === 'a4' && kingDistance(king, 'e7') <= 1) || (king === 'e7' && ['a4', 'b5'].includes(bishop)) ? 5 : (squareColor(king) !== squareColor(bishop)) && king[0] >= 'c' && (['a4', 'd7'].includes(bishop) || kingDistance(king, bishop) === 1) && ((['a4', 'd7'].includes(bishop) && ['c5', 'c6', 'c7'].includes(king)) || (['a4', 'd7'].includes(bishop) && king === 'd6') || (bishop === 'd7' && kingDistance(king, 'a7') <= 2)) ? 5 : 99, `${king}, ${bishop}, ${transform.name}`)
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

test('declared Bb1 rejection and nearby king-color restriction apply across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '43 27']) {
      const before = transformFen(`8/8/8/8/2N5/3K4/B7/3k4 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('a2', transform), to: transformSquare('b1', transform)}).san
      assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 99, knight: 99})
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    }
    for (const [nearby, expected] of [
      ['8/8/8/8/2N5/3K4/8/1B2k3 b - - 1 1', 99], // Kd3 shares Bb1's color.
      ['8/8/8/8/2N5/4K3/8/1B1k4 b - - 1 1', 99] // White is closer to the h1 target.,
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(nearby, transform)).size, expected)
  }
})

test('an approaching seven knight must leave c3 and d4 covered by the king races', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/5B2/4K3/1k2N3/8/8/8/8 w - - 0 1', transform)
    const move = getChess(before).move({from: transformSquare('e6', transform), to: transformSquare('e7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    assert.ok(getIdealKnightAndBishopWhiteMoves(before).every(san => scoreKnightAndBishopWhiteMove(before, san).supportedDiagonalSizeScore === 99))
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
    for (const [position, expected] of [
      ['4B3/8/8/k7/1NK5/8/8/8 b - - 0 1', 99], // Same-color king, knight off support.
      ['4B3/8/8/k2N4/1K6/8/8/8 b - - 0 1', 5],
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(position, transform)).size, expected, position)
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
    for (const [position, expected] of [
      ['k7/3K4/B7/3N4/8/8/8/8 b - - 0 1', 99], // Same-color king, previous-stage knight.
      ['k7/8/BK6/8/1N6/8/8/8 b - - 0 1', 3],
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(position, transform)).size, expected, position)
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
      ['k7/3B4/8/1K1N4/8/8/8/8 b - - 0 1', 99],
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
    // Previous-stage Nd5 also fails with this same-color king.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('2B5/k7/8/1K1N4/8/8/8/8 b - - 0 1', transform)).size, 99)
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
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('k1B5/8/8/1K1N4/8/8/8/8 b - - 0 1', transform)).size, 99)
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
    // The placement declaration cannot bypass Black’s immediate c7 escape.
    const kb5 = getChess(fen).move({from: transformSquare('c6', transform), to: transformSquare('b5', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, kb5).supportedDiagonalSizeScore, 99)
  }
})

test('support requires the seven knight in place while smaller diagonals may use previous-stage or approaching knights', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, size, distance] of [
      ['k1B5/3K4/8/3N4/8/8/8/8 b - - 0 1', 3, 99], // Reflected Ba6/Kb5 declaration, without a target.
      ['k1B5/2K5/8/1N6/8/8/8/8 b - - 0 1', 3, 0],
      ['k1B5/2K5/8/8/3N4/8/8/8 b - - 0 1', 3, 1],
      ['k7/2K5/8/8/B7/3N4/8/8 b - - 0 1', 5, 2],
      ['3k2K1/8/2B5/3N4/8/8/8/8 b - - 0 1', 99, 99],
      ['8/8/k7/2K5/B4N2/8/8/8 b - - 0 1', 99, 99],
      ['3k2K1/8/8/3B4/8/3N4/8/8 b - - 0 1', 99, 99],
      ['3k2K1/8/8/3B4/8/8/5N2/8 b - - 0 1', 99, 99],
    ] as const) assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(fen, transform)), {size, knight: distance}, `${fen}: ${transform.name}`)
    for (const fen of [
      'k7/8/2B5/8/8/8/7N/7K b - - 0 1',
      'k7/8/8/3B4/8/8/7N/7K b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
    // The automatic Ng2 rejection overrides the earlier remote-knight exception.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('k1B5/2K5/8/8/8/8/6N1/8 b - - 0 1', transform)).size, 99)
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
    // A later safe retreat no longer qualifies: Nf4 is off support when Black can attack Ba4.
    assert.deepEqual(knightAndBishopSupportedDiagonal(safe.fen()), {size: 99, knight: 99})
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

test('same-color Nf4 and Bb5 examples now fail with the knight off support', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, from, to] of [
      ['8/2kB4/4K3/8/8/3N4/8/8 w - - 0 1', 'd3', 'f4'],
      ['3k4/3B4/4K3/8/5N2/8/8/8 w - - 0 1', 'd7', 'b5'],
    ] as const) {
      const position = transformFen(fen, transform)
      const move = getChess(position).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
      assert.equal(scoreKnightAndBishopWhiteMove(position, move).supportedDiagonalSizeScore, 99)
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
    // Even without an immediate entry, Kc4 is on the seven wall below Bd5.
    assert.equal(knightAndBishopSupportedDiagonal(noEntry).size, 99)
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

test('a five-bishop with Nd3 rejects Bb5 except for the declared Ke7 placement', () => {
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
      if (king === 'e7') assert.equal(size, 5)
      else assert.notEqual(size, 5, king)
    }
  }
})

test('Bd7 rejects White ahead in the corner race while Kd6 retains support', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/2K5/8/k7/B7/3N4/8/8 w - - 2 2', transform)
    const bd7 = getChess(fen).move({from: transformSquare('a4', transform), to: transformSquare('d7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, bd7).supportedDiagonalSizeScore, 99)
    const loaded = transformFen('8/2K5/k7/8/B7/3N4/8/8 w - - 2 2', transform)
    const bc6 = getChess(loaded).move({from: transformSquare('a4', transform), to: transformSquare('c6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(loaded, bc6).supportedDiagonalSizeScore, 99)
    const preferred = getChess(loaded).move({from: transformSquare('c7', transform), to: transformSquare('d6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(loaded, preferred).supportedDiagonalSizeScore, 5)
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
      ['k7/8/B1K5/3N4/8/8/8/8 b - - 0 1', 99],
      ['k7/8/B7/2KN4/8/8/8/8 b - - 0 1', 99],
      ['8/8/8/3B1N2/k7/8/8/K7 b - - 0 1', 7],
      ['8/8/8/3B1N2/k7/8/8/1K6 b - - 0 1', 99],
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
    for (const sameColor of [
      '1k2B3/8/2K5/3N4/8/8/8/8 b - - 0 1',
      '2k5/3B4/2K5/3N4/8/8/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(sameColor, transform)).size, 99)
    for (const nearby of [
      '2k1B3/8/3K4/3N4/8/8/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(nearby, transform)).size, 5)
  }
})

test('a five-diagonal without a five-knight requires White to match the d6 king race', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('1k6/8/K7/8/5N2/1B6/8/8 w - - 2 2', transform)
    const ba4 = getChess(fen).move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, ba4).supportedDiagonalSizeScore, 99)
    assert.ok(getIdealKnightAndBishopWhiteMoves(fen).every(san => scoreKnightAndBishopWhiteMove(fen, san).supportedDiagonalSizeScore === 99))
    for (const [position, expected] of [
      ['1k6/8/K7/8/B4N2/8/8/8 b - - 0 1', 99],
      ['1k6/8/K7/3N4/B7/8/8/8 b - - 0 1', 99], // Edge kings also need opposite colors.
      ['1k6/8/1K6/8/B4N2/8/8/8 b - - 0 1', 99], // Same file with an off-support knight.
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
    // Nearby kings do not waive the same-color restriction for Bd7/Nd3.
    assert.equal(scoreKnightAndBishopWhiteMove(before, bd7).supportedDiagonalSizeScore, 99)
    for (const [allowed, expected] of [
      // The old remote-king case now fails the universal distance limit.
      ['8/k7/2B1K3/8/5N2/8/8/8 b - - 0 1', 99],
      // Kd6 controls c5, but kings three steps apart now disqualify Nf4.
      ['8/k7/3K4/8/B4N2/8/8/8 b - - 0 1', 99],
      // Knight defense does not waive the universal distance limit.
      ['8/k7/2B1K3/8/1N6/8/8/8 b - - 0 1', 99],
      // From b8 Black cannot reach b6 next move.
      ['1k6/8/4K3/8/B4N2/8/8/8 b - - 0 1', 99],
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

test('Ka8 Ba6 Nb7 disqualification supersedes the reflected Kc7 declaration', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('k7/1N6/B7/1K6/8/8/8/8 w - - 0 1', transform)
    const kb6 = getChess(fen).move({from: transformSquare('b5', transform), to: transformSquare('b6', transform)}).san
    const score = scoreKnightAndBishopWhiteMove(fen, kb6)
    assert.equal(score.supportedDiagonalSizeScore, 99)
    assert.equal(score.supportedDiagonalKnightScore, 99)
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

test('same-color Bb7 with Kc6 cannot use a previous-stage knight', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const knight of ['e1', 'd3', 'd5'] as const) {
      for (const black of ['a7', 'a8', 'b8'] as const) {
        const board = getChess('8/kB6/2K5/8/8/8/8/4N3 b - - 0 1')
        board.remove('e1')
        board.remove('a7')
        board.put({type: 'n', color: 'w'}, knight)
        board.put({type: 'k', color: 'b'}, black)
        assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, 99)
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
          king === 'g3' ? {size: 3, knight: distance} : {size: 3, knight: 99}, `${king}, ${knight}: ${transform.name}`)
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
      // Occupied d3 no longer waives the same-color king restriction.
      ['8/4k3/8/3B1K2/8/3N4/8/8 b - - 3 2', 99],
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
      // Even an empty target cannot rescue an approaching knight with remote kings.
      ['k7/8/8/1BK5/5N2/8/8/8 b - - 1 1', 99],
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
    for (const [position, expected] of [
      ['8/8/8/8/6K1/7B/4N2k/8 b - - 1 1', 3], // Reflected Kb5/Ba6/Ka7 declaration.
      ['8/8/8/8/3N2K1/7B/7k/8 b - - 1 1', 3],
      ['8/8/8/8/6K1/8/4N3/5B1k b - - 1 1', 99],
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(position, transform)).size, expected)
  }
})


test('kings outside the diagonal require kings within three steps after White, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('8/8/1k2B3/8/8/3N4/8/1K6 w - - 0 1', transform))
    const before = board.fen()
    const move = board.move({from: transformSquare('b1', transform), to: transformSquare('c2', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    // Positions within the three-step boundary retain support in each family.
    for (const [fen, size] of [
      ['8/8/2k5/8/8/1BKN4/8/8 b - - 1 1', 7],
      ['k7/8/3K4/8/B7/3N4/8/8 b - - 1 1', 5],
      ['1k6/8/BK6/3N4/8/8/8/8 b - - 1 1', 3],
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, size)
  }
})

test('White inside the diagonal waives king distance while other support checks remain, across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('K7/8/8/8/k7/3N4/B7/8 w - - 0 1', transform))
    board.move({from: transformSquare('a8', transform), to: transformSquare('b7', transform)})
    board.move({from: transformSquare('a4', transform), to: transformSquare('a3', transform)})
    const before = board.fen()
    const san = board.move({from: transformSquare('a2', transform), to: transformSquare('d5', transform)}).san
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(before, san).supportedDiagonalSizeScore, 99)
    // Kb7 and Bd5 share a color despite White being inside the diagonal.
    board.remove(transformSquare('d3', transform))
    board.put({type: 'n', color: 'w'}, transformSquare('f4', transform))
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
  }
})


test('an edge knight disqualifies support except the applicable king-bishop declarations', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      '8/8/8/8/1k1K4/8/B7/2N5 b - - 1 1', // Loaded Kd4: Nc1.
      '1k6/8/B1K5/N7/8/8/8/8 b - - 0 1', // Former declared three placement.
      '2B1k3/2K5/8/8/8/8/7N/8 b - - 0 1', // Black is outside the declared pair's diagonal.
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
      '6B1/4k3/8/4KN2/8/8/8/8 b - - 3 2',
    ]) assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(fen, transform)), {size: 7, knight: 0})
  }
})

test('a five-bishop with its five-knight is unsupported when White king shares the bishop color', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('2k5/8/2B5/1K1N4/8/8/8/8 w - - 0 1', transform)
    const board = getChess(before)
    const be8 = board.move({from: transformSquare('c6', transform), to: transformSquare('e8', transform)}).san
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 99, knight: 99})
    assert.equal(scoreKnightAndBishopWhiteMove(before, be8).supportedDiagonalSizeScore, 99)
    for (const bishop of ['a4', 'b5', 'd7', 'e8'] as const) {
      const position = getChess('2k5/8/8/3N4/2K5/8/8/8 b - - 42 23')
      position.put({color: 'w', type: 'b'}, bishop)
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(position.fen(), transform)).size, 99)
    }
    // An opposite-colored king can still support Be8/Nd5.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('2k1B3/8/8/2KN4/8/8/8/8 b - - 0 1', transform)).size, 5)
    // This restores the five-knight condition; the separate Nd3 allowance remains.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('4B3/8/k7/2K5/8/3N4/8/8 b - - 0 1', transform)).size, 5)
  }
})

test('declared second-move Kd7 with Bb5 Nd5 against Kb7 overrides only its king-color restriction', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2', '41 23']) {
      const fen = transformFen(`3K4/1k6/8/1B1N4/8/8/8/8 w - - ${counters}`, transform)
      const board = getChess(fen)
      const move = board.move({from: transformSquare('d8', transform), to: transformSquare('d7', transform)}).san
      assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: 0})
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move).supportedDiagonalSizeScore, 5)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    }
    // Classification is after White's move. Black's later Ka7 is not the declared placement.
    for (const fen of [
      '8/k2K4/8/1B1N4/8/8/8/8 b - - 0 1',
      '1k6/3K4/8/1B1N4/8/8/8/8 b - - 0 1',
      '8/1k1K4/8/1B6/8/3N4/8/8 b - - 0 1',
      '8/1k1K4/2B5/3N4/8/8/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99, fen)
  }
})


test('same-color kings with knights off current support are unsupported except declared placements', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      '8/8/1k6/8/BNK5/8/8/8 b - - 1 1', // Loaded Ba4: Nb4 is one move from d5.
      '8/8/1k6/1B6/1NK5/8/8/8 b - - 3 2', // Loaded Bb5.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99, fen)
    for (const [fen, size] of [
      ['8/1k1K4/8/1B1N4/8/8/8/8 b - - 0 1', 5], // Exact Kd7 declaration.
      ['8/8/1k6/3K4/B7/3N4/8/8 b - - 0 1', 5], // Exact Ba4 declaration: same color, previous-stage Nd3.
      ['1kB5/8/1K1N4/8/8/8/8/8 b - - 0 1', 3], // Exact Nd6 declaration.
      ['k1B5/3K4/8/3N4/8/8/8/8 b - - 0 1', 3], // Reflected Ba6/Kb5 declaration.
      ['8/8/8/8/1k1K4/3N4/B7/8 b - - 1 1', 7], // Actual seven support remains eligible.
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, size, fen)
  }
})


test('declared Kb5 Ba6 supports all knight locations while Black stays inside', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const knight of allSquares()) {
      if (['b5', 'a6', 'a7'].includes(knight)) continue
      const board = getChess('8/k7/B7/1K6/8/8/8/8 b - - 73 42')
      board.put({type: 'n', color: 'w'}, knight)
      assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)),
        {size: ['b2', 'b7', 'g2', 'g7'].includes(knight) ? 99 : 3, knight: 99}, knight + transform.name)
    }
    const before = transformFen('8/k7/B7/K2N4/8/8/8/8 w - - 2 2', transform)
    const move = getChess(before).move({from: transformSquare('a5', transform), to: transformSquare('b5', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 3)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    for (const fen of [
      '8/8/B7/1K2k3/8/8/8/4N3 b - - 0 1', // Black outside the diagonal.
      '8/k7/B1K5/8/8/8/8/4N3 b - - 0 1', // Different White king.
      '2B5/k7/8/1K6/8/8/8/4N3 b - - 0 1', // Different bishop.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
  }
})


test('declared second-move Nf6 supports Kb5 Ba6 versus Ka8 without adding a knight target', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2', '41 23']) {
      const before = transformFen(`k7/3N4/B7/1K6/8/8/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      board.move({from: transformSquare('d7', transform), to: transformSquare('f6', transform)})
      assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 3, knight: 99})
      // r9.98 now prefers a knight one move from bishop protection.
      const nb6 = getChess(before).move({from: transformSquare('d7', transform), to: transformSquare('b6', transform)}).san
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [nb6])
    }
    for (const fen of [
      'k7/8/B4N2/2K5/8/8/8/8 b - - 0 1',
      'k1B5/8/5N2/1K6/8/8/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
  }
})


test('Ba6 Kb6 requires Black inside and knight off the middle three-diagonal square', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const black of allSquares()) {
      if (black === 'a6' || kingDistance('b6', black) <= 1) continue
      for (const knight of allSquares()) {
        if (['a6', 'b6', black].includes(knight)) continue
        const board = getChess('k7/8/BK6/8/8/8/8/8 b - - 47 25')
        board.remove('a8')
        board.put({type: 'k', color: 'b'}, black)
        board.put({type: 'n', color: 'w'}, knight)
        const size = knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size
        const inside = isInsideBishopDiagonal(black, ['a6', 'b7', 'c8'])
        assert.equal(size === 3, inside && !['b2', 'b7', 'g2', 'g7'].includes(knight), `${black} ${knight} ${transform.name}`)
      }
    }
    const before = transformFen('1k6/8/B7/NK6/8/8/8/8 w - - 2 2', transform)
    const kb6 = getChess(before).move({from: transformSquare('b5', transform), to: transformSquare('b6', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [kb6])
    const target = transformFen('k7/8/BK6/8/8/8/8/N7 b - - 4 3', transform)
    assert.ok(knightAndBishopSupportedDiagonal(target).knight < 99, 'real knight targets remain available')
  }
})


test('Bb7+ with Kb6 is supported and preferred by r1 with Na7 one move from c6', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2', '51 28']) {
      const before = transformFen(`k7/N7/BK6/8/8/8/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('a6', transform), to: transformSquare('b7', transform)}).san
      assert.ok(board.isCheck())
      assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 3, knight: 1})
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedThreeCheckScore, 0)
      assert.equal(scoreKnightAndBishopWhiteMove(before, getChess(before).move({
        from: transformSquare('a7', transform), to: transformSquare('b5', transform),
      }).san).supportedThreeCheckScore, 1)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    }
    for (const position of [
      'k7/1B6/1K6/8/8/8/8/N7 b - - 3 2', // Knight too far from current support.
      '1k6/NB6/1K6/8/8/8/8/8 b - - 3 2', // Bishop does not check.
      'k7/NB6/8/2K5/8/8/8/8 b - - 3 2', // King is not on the declared square.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(position, transform)).size, 99)
  }
})


test('same-color edge kings require a specific support declaration', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2', '43 25']) {
      const before = transformFen(`3K4/3B4/k7/8/8/3N4/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('d8', transform), to: transformSquare('c8', transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    }
    // An edge king still needs two files of separation with Nd3.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('2K5/3B4/1k6/8/8/3N4/8/8 b - - 3 2', transform)).size, 99)
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('1k6/8/K7/3N4/B7/8/8/8 b - - 0 1', transform)).size, 99)
    // The edge exemption does not waive the independent knight-on-edge restriction.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('2KB4/8/1k6/8/8/8/8/N7 b - - 0 1', transform)).size, 99)
  }
})


test('declared 2. Nd5 is supported and preferred with Kb5 Ba6 against Kb8', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2', '51 28']) {
      const before = transformFen(`1k6/8/BN6/1K6/8/8/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('b6', transform), to: transformSquare('d5', transform)}).san
      assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 3, knight: 99})
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).declaredSupportedThreePenalty, 0)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    }
    for (const position of [
      '1k6/8/B7/3N4/2K5/8/8/8 b - - 3 2', // Different White king.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(position, transform)).size, 99)
  }
})


test('Ba6 Kb5 support requires Black unable to leave the diagonal immediately', () => {
 for (const t of SQUARE_TRANSFORMS) {
  const f = transformFen('1k6/8/B7/8/KN6/8/8/8 w - - 0 1',t);
  const c = getChess(f);c.move({from:transformSquare('a4',t),to:transformSquare('b5',t)});
  assert.ok(c.moves({verbose:true}).some(m=>m.to===transformSquare('c7',t)));
  assert.equal(knightAndBishopSupportedDiagonal(c.fen()).size,99);
  const start=transformFen('1k6/8/BN6/K7/8/8/8/8 w - - 0 1',t);
  const san=getChess(start).move({from:transformSquare('b6',t),to:transformSquare('d5',t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(start,san).supportedDiagonalSizeScore,3);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(start),[san]);
 }
});


test('Ba4 Nd3 versus Kd8 is supported iff White king is adjacent to e7, across D4', () => {
 for (const king of allSquares()) {
  if (['a4','d3','d8'].includes(king) || kingDistance(king,'d8') <= 1) continue
  const board=getChess('3k4/8/8/8/B7/3N4/8/7K b - - 0 1')
  board.remove('h1')
  board.put({type:'k',color:'w'},king)
  for (const t of SQUARE_TRANSFORMS) {
   assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(),t)).size,
    kingDistance(king,'e7') === 1 ? 5 : 99, king+' '+t.name)
  }
 }
 const before='3k1K2/8/8/8/8/1B1N4/8/8 w - - 2 2'
 assert.equal(scoreKnightAndBishopWhiteMove(before,'Ba4').supportedDiagonalSizeScore,5)
 assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before),['Ba4'])
});


test('declared Ba4 with Kd7 Nd3 against Kb7 is supported and preferred across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '27 15']) {
      const before = transformFen(`8/1k1K4/8/8/8/1B1N4/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    }
  }
})


test('declared Kd8 with Be8 Nd3 against Kb6 is supported across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['3 3', '29 16']) {
      const before = transformFen(`2K1B3/8/1k6/8/8/3N4/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('c8', transform), to: transformSquare('d8', transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
    }
  }
})


test('declared Ba4 with Kd7 Nd3 against Kb8 is supported and preferred across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['1 2', '31 18']) {
      const before = transformFen(`1k6/3K4/8/8/8/1B1N4/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    }
  }
})


test('declared second-move Ba4 with Kd8 Nd3 against Kb8 or Kb7 is supported across D4', () => {
  const lines = [
    {fen: '3K4/1k6/4B3/8/8/3N4/8/8 w - - 1 2', reply: 'b8'},
    {fen: '3K4/8/1k2B3/8/8/3N4/8/8 w - - 1 2', reply: 'b7'},
  ] as const
  for (const transform of SQUARE_TRANSFORMS) {
    for (const {fen, reply} of lines) {
      const board = getChess(transformFen(fen, transform))
      board.move({from: transformSquare('e6', transform), to: transformSquare('d7', transform)})
      const black = reply === 'b8' ? 'b7' : 'b6'
      board.move({from: transformSquare(black, transform), to: transformSquare(reply, transform)})
      const before = board.fen()
      const move = board.move({from: transformSquare('d7', transform), to: transformSquare('a4', transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
      assert.ok(getIdealKnightAndBishopWhiteMoves(before).includes(move), before)
    }
  }
})


test('declared Kd6 Be8 Nb4 against Kc8 is unsupported across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('2k1B3/8/2K5/8/1N6/8/8/8 w - - 0 1', transform)
    const chess = getChess(before)
    const move = chess.move({ from: transformSquare('c6', transform), to: transformSquare('d6', transform) })
    assert.equal(knightAndBishopSupportedDiagonal(chess.fen()).size, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(before, move.san).supportedDiagonalSizeScore, 99)
    // Nc3 now also fails the universal five-diagonal knight requirement.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('2k1B3/8/3K4/8/8/2N5/8/8 b - - 1 1', transform)).size, 99)
  }
})


test('declared second-move Bd7 with Kc5 Ne3 against Ka5 is supported and preferred across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('8/8/k1K5/8/B7/4N3/8/8 w - - 0 1', transform))
    board.move({from: transformSquare('c6', transform), to: transformSquare('c5', transform)})
    board.move({from: transformSquare('a6', transform), to: transformSquare('a5', transform)})
    const before = board.fen()
    const move = board.move({from: transformSquare('a4', transform), to: transformSquare('d7', transform)})
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
    assert.equal(scoreKnightAndBishopWhiteMove(before, move.san).supportedDiagonalSizeScore, 5)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move.san])
    const nearby = transformFen('8/3B4/8/k1K5/8/5N2/8/8 b - - 3 2', transform)
    assert.equal(knightAndBishopSupportedDiagonal(nearby).size, 99)
  }
})


test('Bb5 with Kd6 versus Kd8 supports approaches to both d5 and d3 or f5 across D4', () => {
  for (const knight of allSquares().filter(square =>
    edgeDistance(square) > 0 && square !== 'd6' &&
    (isKnightMove(square, 'd3') || isKnightMove(square, 'f5')))) {
    const original = getChess('3k4/8/3K4/1B6/8/8/8/8 b - - 0 1')
    original.put({type: 'n', color: 'w'}, knight)
    for (const transform of SQUARE_TRANSFORMS) {
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(original.fen(), transform)).size,
        !isKnightMove(knight, 'd5') || ['b2', 'b7', 'g2', 'g7'].includes(knight) ? 99 : 5, knight + ' ' + transform.name)
    }
  }
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('3kB3/8/3K4/8/8/4N3/8/8 w - - 2 2', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('e8', transform), to: transformSquare('b5', transform)})
    assert.equal(scoreKnightAndBishopWhiteMove(before, move.san).supportedDiagonalSizeScore, 5)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move.san])
    for (const fen of [
      '3k4/8/3K4/1B6/8/5N2/8/8 b - - 0 1',
      '3k4/8/3K4/1B6/8/8/8/2N5 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
  }
})


test('five support rejects knights outside both-stage eligibility across D4', () => {
  for (const knight of allSquares()) {
    if (['d6', 'b5', 'd8'].includes(knight) || ['d3', 'f5', 'd5'].includes(knight) ||
      ((isKnightMove(knight, 'd3') || isKnightMove(knight, 'f5')) && isKnightMove(knight, 'd5'))) continue
    const board = getChess('3k4/8/3K4/1B6/8/8/8/8 b - - 0 1')
    board.put({type: 'n', color: 'w'}, knight)
    for (const transform of SQUARE_TRANSFORMS) {
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, 99, knight + ' ' + transform.name)
    }
  }
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('2k1B3/8/2K5/8/8/2N5/8/8 w - - 0 1', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('c6', transform), to: transformSquare('d6', transform)})
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(before, move.san).supportedDiagonalSizeScore, 99)
    // This older exact declaration is also subject to the new universal requirement.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('1k6/3B4/1K3N2/8/8/8/8/8 b - - 0 1', transform)).size, 99)
  }
})

test('declared 2. Ke5 with Ba4 Nd3 against Kc7 is supported across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('8/8/1k6/3K4/8/1B1N4/8/8 w - - 0 1', t))
    board.move({from: transformSquare('b3', t), to: transformSquare('a4', t)})
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
    board.move({from: transformSquare('b6', t), to: transformSquare('c7', t)})
    const before = board.fen()
    const move = board.move({from: transformSquare('d5', t), to: transformSquare('e5', t)}).san
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
    // The later e7-cage declaration also supports Ke6; preference is decided by later rules.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('8/2k5/4K3/8/B7/3N4/8/8 b - - 0 1', t)).size, 5)
  }
})


test('off-support knight cannot allow Black to attack an undefended bishop, across D4', () => {
  const before = '1k6/3B4/8/1K6/1N6/8/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(before, transform)
    const board = getChess(fen)
    const move = board.move({from: transformSquare('b5', transform), to: transformSquare('c5', transform)}).san
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 99, knight: 99})
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).supportedDiagonalSizeScore, 99)
    const replies = board.moves({verbose: true}).map(reply => reply.to)
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen(), replies), {size: 99, knight: 99})
    assert.ok(replies.includes(transformSquare('c7', transform)))
  }
})


test('the bishop-attack restriction preserves king defense and occupied support squares', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      '1k6/3B4/3K4/8/1N6/8/8/8 b - - 0 1', // Kd6 already defends Bd7.
      '1k6/3B4/8/2KN4/8/8/8/8 b - - 0 1', // Nd5 occupies the five support square.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
  }
})


test('Ke7 Nd3 declares Ba4 and Bb5 supported only with Black inside the cage, across D4', () => {
  for (const bishop of ['a4', 'b5'] as const) {
    for (const black of allSquares()) {
      if ([bishop, 'e7', 'd3'].includes(black) || kingDistance('e7', black) <= 1) continue
      const board = getChess('8/4K3/8/8/B7/3N4/8/7k b - - 0 1')
      board.remove('a4')
      board.remove('h1')
      board.put({type: 'b', color: 'w'}, bishop)
      board.put({type: 'k', color: 'b'}, black)
      for (const transform of SQUARE_TRANSFORMS) {
        const fen = transformFen(board.fen(), transform)
        const inside = isInsideBishopDiagonal(black, ['a4', 'b5', 'c6', 'd7', 'e8'])
        assert.deepEqual(knightAndBishopSupportedDiagonal(fen), inside ? {size: 5, knight: 2} : {size: 99, knight: 99}, `${bishop}, ${black}, ${transform.name}`)
      }
    }
  }
})

test('loaded Ke7 after Ba4 Kc8 is supported without extending to a different knight or Bc6', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('2k5/8/4K3/8/B7/3N4/8/8 w - - 2 2', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('e6', transform), to: transformSquare('e7', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
    for (const fen of [
      '2k5/4K3/8/8/B7/8/8/1N6 b - - 0 1',
      '2k5/4K3/2B5/8/8/3N4/8/8 b - - 0 1',
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
  }
})


test('Ke7 cannot establish support with Black Kf5 outside the Bb5 cage', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('5K2/8/8/1B3k2/8/3N4/8/8 w - - 0 1', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('f8', transform), to: transformSquare('e7', transform)}).san
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 99, knight: 99})
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
  }
})


test('Ka8 Bc8 Nb7 disqualification supersedes the earlier Kc7 support declaration across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '23 12']) {
      const before = transformFen(`k1BK4/1N6/8/8/8/8/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('d8', transform), to: transformSquare('c7', transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    }
    for (const fen of [
      'k1B5/1N6/2K5/8/8/8/8/8 b - - 0 1', // Different king placement: no exception.
      '2B5/1NK5/8/4k3/8/8/8/8 b - - 0 1', // Outside the cage.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
  }
})


test('Ka2 Nd3 automatically disqualifies support, including D4 equivalents', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/8/8/k7/B7/3N4/K7/8 w - - 0 1', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('a4', transform), to: transformSquare('b3', transform)}).san
    assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 99, knight: 99})
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    // Moving the king off the declared square can still establish support.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('8/8/8/k7/8/1B1N4/1K6/8 b - - 0 1', transform)).size, 7)
  }
  for (const bishop of allSquares()) for (const black of allSquares()) {
    if (new Set(['a2', 'd3', bishop, black]).size !== 4 || kingDistance('a2', black) <= 1) continue
    const board = getChess('7k/8/8/8/8/3N4/K7/8 b - - 0 1')
    board.remove('h8')
    board.put({type: 'b', color: 'w'}, bishop)
    board.put({type: 'k', color: 'b'}, black)
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99, `${bishop} ${black}`)
  }
})


test('Ba4 Nd3 with White on or adjacent to e7 supports five when Black cannot move to a5 or d6', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const board = getChess(transformFen('8/2k5/8/4K3/8/1B1N4/8/8 w - - 0 1', transform))
    board.move({from: transformSquare('b3', transform), to: transformSquare('a4', transform)})
    board.move({from: transformSquare('c7', transform), to: transformSquare('c8', transform)})
    const before = board.fen()
    const move = board.move({from: transformSquare('e5', transform), to: transformSquare('d6', transform)}).san
    const replies = board.moves({verbose: true}).map(reply => reply.to)
    assert.ok(!replies.includes(transformSquare('a5', transform)))
    assert.ok(!replies.includes(transformSquare('d6', transform)))
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5)
    assert.equal(knightAndBishopSupportedDiagonal(board.fen(), replies).size, 5)
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
    // The universal cage prerequisite still applies.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('8/8/3K4/7k/B7/3N4/8/8 b - - 0 1', transform)).size, 99)
    // Black can reach a5, so proximity to e7 alone does not declare support.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('8/8/5K2/1k6/B7/3N4/8/8 b - - 0 1', transform)).size, 99)
  }
})


test('Black Ka8 Bc8 Nb7 is never supported for any White king placement across D4', () => {
  for (const king of allSquares()) {
    if (['a8', 'c8', 'b7'].includes(king) || kingDistance(king, 'a8') <= 1) continue
    const board = getChess('k1B4K/1N6/8/8/8/8/8/8 b - - 0 1')
    board.remove('h8')
    board.put({type: 'k', color: 'w'}, king)
    for (const transform of SQUARE_TRANSFORMS) {
      assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)), {size: 99, knight: 99})
    }
  }
  // The broader Nb7 ban also applies when Black changes squares.
  assert.equal(knightAndBishopSupportedDiagonal('1kB5/1N1K4/8/8/8/8/8/8 b - - 0 1').size, 99)
})
