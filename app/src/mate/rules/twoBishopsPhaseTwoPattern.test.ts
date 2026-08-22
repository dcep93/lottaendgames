import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, getChess, transformFen } from '../chess'
import { getIdealTwoBishopsWhiteMoves } from './twoBishops'
import { getTwoBishopsPhaseLabel } from './twoBishopsGeometry'
import {
  getTwoBishopsPhaseTwoPatternMoves,
  isTwoBishopsPhaseTwoPatternPosition,
} from './twoBishopsPhaseTwoPattern'
import {
  TWO_BISHOPS_PHASE_TWO_CANONICAL_MOVES,
  TWO_BISHOPS_PHASE_TWO_START_FEN,
} from './twoBishopsPhaseTwoPatternData'

test('canonical Phase 2 line is recognized and selected through mate', () => {
  const chess = getChess(TWO_BISHOPS_PHASE_TWO_START_FEN)
  for (const san of TWO_BISHOPS_PHASE_TWO_CANONICAL_MOVES) {
    assert.equal(isTwoBishopsPhaseTwoPatternPosition(chess.fen()), true, san)
    assert.equal(getTwoBishopsPhaseLabel(chess.fen()), '2/2', san)
    if (chess.turn() === 'w') {
      assert.ok(getTwoBishopsPhaseTwoPatternMoves(chess.fen()).includes(san))
      assert.ok(getIdealTwoBishopsWhiteMoves(chess.fen()).includes(san))
    }
    chess.move(san)
  }
  assert.equal(chess.isCheckmate(), true)
  assert.equal(isTwoBishopsPhaseTwoPatternPosition(chess.fen()), true)
})

test('waiting stages accept every successful move on the specified diagonal', () => {
  const chess = getChess(TWO_BISHOPS_PHASE_TWO_START_FEN)
  chess.move('Bh4')
  chess.move('Kh3')
  assert.deepEqual(getTwoBishopsPhaseTwoPatternMoves(chess.fen()), [
    'Bd8',
    'Be7',
    'Bf6',
    'Bg5',
  ])
})

test('all rotations and reflections of the Phase 2 start are recognized', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(TWO_BISHOPS_PHASE_TWO_START_FEN, transform)
    assert.equal(isTwoBishopsPhaseTwoPatternPosition(fen), true, transform.name)
    assert.equal(getTwoBishopsPhaseTwoPatternMoves(fen).length, 2)
  }
})

test('an unlisted Black branch returns to Phase 1', () => {
  const chess = getChess(TWO_BISHOPS_PHASE_TWO_START_FEN)
  chess.move('Bh4')
  chess.move('Kh1')
  assert.equal(isTwoBishopsPhaseTwoPatternPosition(chess.fen()), false)
  assert.equal(getTwoBishopsPhaseLabel(chess.fen()), '1/2')
})

test('Kf2 Kh1 branch accepts either waiting diagonal and rejoins Phase 2', () => {
  const fen = '8/8/8/6B1/8/8/5K2/3B3k w - - 2 2'
  assert.equal(getTwoBishopsPhaseLabel(fen), '2/2')
  assert.deepEqual(getTwoBishopsPhaseTwoPatternMoves(fen), [
    'Bd8',
    'Be2',
    'Be7',
    'Bf3+',
    'Bf6',
    'Bh4',
    'Bh5',
  ])
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen).sort(), [
    'Bd8',
    'Be2',
    'Be7',
    'Bf3+',
    'Bf6',
    'Bh4',
    'Bh5',
  ])
})

test('mate in 8 ish D handles the early Kh1 deviation through mate', () => {
  const chess = getChess(TWO_BISHOPS_PHASE_TWO_START_FEN)
  const moves = [
    'Bh4',
    'Kh3',
    'Bf6',
    'Kh2',
    'Kf2',
    'Kh1',
    'Be2',
    'Kh2',
    'Bg4',
    'Kh1',
    'Be7',
    'Kh2',
    'Bd6+',
    'Kh1',
    'Bf3#',
  ] as const

  for (const san of moves) {
    assert.equal(isTwoBishopsPhaseTwoPatternPosition(chess.fen()), true, san)
    if (chess.turn() === 'w') {
      assert.ok(getIdealTwoBishopsWhiteMoves(chess.fen()).includes(san), san)
    }
    chess.move(san)
  }
  assert.equal(chess.isCheckmate(), true)
})

test('mate in 8 ish E follows the browser king-retreat line through mate', () => {
  const chess = getChess(TWO_BISHOPS_PHASE_TWO_START_FEN)
  const moves = [
    'Kf2',
    'Kh3',
    'Kf1',
    'Kh2',
    'Bg4',
    'Kh1',
    'Bh4',
    'Kh2',
    'Kf2',
    'Kh1',
    'Bf5',
    'Kh2',
    'Bg3+',
    'Kh1',
    'Be4#',
  ] as const

  for (const san of moves) {
    assert.equal(isTwoBishopsPhaseTwoPatternPosition(chess.fen()), true, san)
    if (chess.turn() === 'w') {
      assert.ok(getIdealTwoBishopsWhiteMoves(chess.fen()).includes(san), san)
    }
    chess.move(san)
  }
  assert.equal(chess.isCheckmate(), true)
})

test('mate in 8 ish B follows the live browser line through mate', () => {
  const chess = getChess(TWO_BISHOPS_PHASE_TWO_START_FEN)
  const moves = [
    'Kf2',
    'Kh1',
    'Kf1',
    'Kh2',
    'Bg4',
    'Kh1',
    'Bh4',
    'Kh2',
    'Kf2',
    'Kh1',
    'Bg5',
    'Kh2',
    'Bf4+',
    'Kh1',
    'Bf3#',
  ] as const

  for (const san of moves) {
    assert.equal(isTwoBishopsPhaseTwoPatternPosition(chess.fen()), true, san)
    if (chess.turn() === 'w') {
      assert.ok(getIdealTwoBishopsWhiteMoves(chess.fen()).includes(san), san)
    }
    chess.move(san)
  }
  assert.equal(chess.isCheckmate(), true)
})

test('mate in 8 ish F supports both move-4 retreats and every move-7 waiting square', () => {
  const start = '8/8/8/8/8/5K1k/8/3BB3 w - - 0 1'
  const browserLine = [
    'Be2',
    'Kh2',
    'Kf2',
    'Kh3',
    'Bd2',
    'Kh4',
    'Bf3',
    'Kh3',
    'Bg5',
    'Kh2',
    'Bg4',
    'Kh1',
    'Bf5',
    'Kh2',
    'Bf4+',
    'Kh1',
    'Be4#',
  ] as const
  const chess = getChess(start)
  for (const san of browserLine) {
    assert.equal(isTwoBishopsPhaseTwoPatternPosition(chess.fen()), true, san)
    if (chess.turn() === 'w') {
      assert.ok(getIdealTwoBishopsWhiteMoves(chess.fen()).includes(san), san)
    }
    chess.move(san)
  }
  assert.equal(chess.isCheckmate(), true)

  const alternateMoveFour = getChess(start)
  for (const san of [
    'Be2',
    'Kh2',
    'Kf2',
    'Kh3',
    'Bd2',
    'Kh4',
    'Bd1',
    'Kh3',
    'Bg5',
    'Kh2',
    'Bg4',
    'Kh1',
  ]) {
    if (alternateMoveFour.turn() === 'w') {
      assert.ok(
        getIdealTwoBishopsWhiteMoves(alternateMoveFour.fen()).includes(san),
        san,
      )
    }
    alternateMoveFour.move(san)
  }
  const moveSevenChoices = getTwoBishopsPhaseTwoPatternMoves(
    alternateMoveFour.fen(),
  )
  for (const san of ['Bc8', 'Bd7', 'Be6', 'Bf5']) {
    assert.ok(moveSevenChoices.includes(san), san)
  }
  assert.equal(
    moveSevenChoices.includes('Bh3+'),
    false,
  )
})

test('mate in 8 ish G supports every move-2 waiting square and reaches mate', () => {
  const start = '8/8/8/8/8/8/3BBK1k/8 w - - 4 3'
  const chess = getChess(start)
  const moves = ['Bg4', 'Kh1', 'Bf5', 'Kh2', 'Bf4+', 'Kh1', 'Be4#']
  for (const san of moves) {
    assert.equal(isTwoBishopsPhaseTwoPatternPosition(chess.fen()), true, san)
    if (chess.turn() === 'w') {
      assert.ok(getIdealTwoBishopsWhiteMoves(chess.fen()).includes(san), san)
    }
    chess.move(san)
  }
  assert.equal(chess.isCheckmate(), true)

  const waitingPosition = getChess(start)
  waitingPosition.move('Bg4')
  waitingPosition.move('Kh1')
  const moveTwoChoices = getTwoBishopsPhaseTwoPatternMoves(
    waitingPosition.fen(),
  )
  for (const san of ['Bc8', 'Bd7', 'Be6', 'Bf5']) {
    assert.ok(moveTwoChoices.includes(san), san)
  }
  assert.equal(moveTwoChoices.includes('Bh3+'), false)
})

test('Bf2 waiting loop is not part of the Phase 2 pattern', () => {
  const chess = getChess(TWO_BISHOPS_PHASE_TWO_START_FEN)
  assert.equal(getTwoBishopsPhaseLabel(chess.fen()), '2/2')
  assert.deepEqual(getTwoBishopsPhaseTwoPatternMoves(chess.fen()), [
    'Bh4',
    'Kf2',
  ])
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(chess.fen()), ['Kf2', 'Bh4'])
  assert.equal(getIdealTwoBishopsWhiteMoves(chess.fen()).includes('Bf2'), false)
})

test('mate in 8 ish C accepts one waiting flow for all d8-h4 flavors', () => {
  const start = '8/8/8/7B/7B/5K2/8/6k1 w - - 0 1'
  const waitingFlows = [
    ['Bg5', 'Be3+'],
    ['Bf6', 'Bd4+'],
    ['Be7', 'Bc5+'],
    ['Bd8', 'Bb6+'],
  ] as const

  for (const [waitingMove, checkingMove] of waitingFlows) {
    const chess = getChess(start)
    for (const san of ['Kg3', 'Kf1', 'Kh3', 'Kg1', 'Be2', 'Kh1']) {
      if (chess.turn() === 'w') {
        assert.ok(getIdealTwoBishopsWhiteMoves(chess.fen()).includes(san), san)
      }
      chess.move(san)
    }

    assert.deepEqual(getTwoBishopsPhaseTwoPatternMoves(chess.fen()), [
      'Bd8',
      'Be1',
      'Be7',
      'Bf6',
      'Bg5',
    ])
    assert.ok(getIdealTwoBishopsWhiteMoves(chess.fen()).includes(waitingMove))
    chess.move(waitingMove)
    chess.move('Kg1')
    assert.deepEqual(getTwoBishopsPhaseTwoPatternMoves(chess.fen()), [
      checkingMove,
    ])
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(chess.fen()), [checkingMove])
    chess.move(checkingMove)
    chess.move('Kh1')
    assert.deepEqual(getTwoBishopsPhaseTwoPatternMoves(chess.fen()), ['Bf3#'])
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(chess.fen()), ['Bf3#'])
    chess.move('Bf3#')
    assert.equal(chess.isCheckmate(), true)
  }
})
