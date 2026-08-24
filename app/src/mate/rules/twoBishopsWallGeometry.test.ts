import assert from 'node:assert/strict'
import test from 'node:test'
import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  getChess,
  transformFen,
  transformSquare,
} from '../chess'
import {
  getIdealTwoBishopsWhiteMoves,
  scoreTwoBishopsWhiteMove,
} from './twoBishops'
import { getTwoBishopsPhaseLabel } from './twoBishopsGeometry'
import {
  getRuleNPreferredMoves,
  getRuleWYPreferredMoves,
  getSmallestTwoBishopsWallArea,
  getTwoBishopsWalls,
} from './twoBishopsWallGeometry'

const LOADED_WALL_FEN =
  '2B5/8/6k1/8/3K3B/8/8/8 w - - 18 10'
const RULE_N_FEN = '8/8/8/8/8/2BB4/k7/2K5 w - - 0 1'
const RULE_N_DISTANCE_TWO_FEN =
  '8/8/8/8/5K2/7k/4BB2/8 w - - 0 1'
const RULE_N_DISTANCE_THREE_FEN =
  '8/8/8/5K2/7k/4BB2/8/8 w - - 0 1'
const RULE_N_DISTANCE_FOUR_FEN =
  '8/8/5K2/7k/4BB2/8/8/8 w - - 0 1'
const RULE_O_OCCUPIED_WALL_FEN =
  '8/8/7B/8/5K1k/8/4B3/8 w - - 0 1'
const RULE_WY_FEN = '8/8/8/8/8/5K2/4BB1k/8 w - - 0 1'
const RULE_W2_FEN = '8/8/8/8/5K2/8/3B1k2/3B4 w - - 0 1'

test('wall area is measured from the nearer diagonal position', () => {
  const wall = getTwoBishopsWalls(LOADED_WALL_FEN).find(
    ({ corner, escapeSquare, wallSquares }) =>
      corner === 'h8' &&
      escapeSquare === 'f5' &&
      wallSquares.includes('g5'),
  )
  assert.ok(wall)
  assert.deepEqual(wall.nearerDiagonal, { axis: 'sum', index: 10 })
  assert.deepEqual(wall.fartherDiagonal, { axis: 'sum', index: 9 })
  assert.equal(wall.cornerDiagonalDistance, 4)
  assert.equal(wall.areaSquares.length, 10)
  assert.ok(wall.wallSquares.includes('g5'))
  assert.ok(wall.wallSquares.includes('f5'))
})

test('a safely screened farther diagonal remains a wall', () => {
  const safeScreen = '2B5/8/4K1k1/8/7B/8/8/8 w - - 0 1'
  const exploitableScreen = '2B5/3K4/6k1/8/7B/8/8/8 w - - 0 1'

  assert.ok(
    getTwoBishopsWalls(safeScreen).some(
      ({ corner, escapeSquare }) => corner === 'h8' && escapeSquare === 'f5',
    ),
  )
  assert.equal(getTwoBishopsWalls(exploitableScreen).length, 0)
})

test('a safely screened nearer diagonal remains a functional Phase 2 wall', () => {
  const fen = '8/8/8/8/8/7k/3B1K2/3B4 w - - 4 3'
  const result = getChess(fen)
  result.move('Kf3')

  assert.ok(
    getTwoBishopsWalls(result.fen()).some(
      ({ areaSquares, corner, cornerDiagonalDistance }) =>
        corner === 'h1' &&
        cornerDiagonalDistance === 4 &&
        areaSquares.length === 10,
    ),
  )
  assert.equal(getTwoBishopsPhaseLabel(result.fen()), '2/2')
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kf3').ruleOPenalty, 10)
})

test("White's king inside Black's area does not disqualify an eligible wall", () => {
  const whiteInside =
    '8/8/6B1/6B1/8/6K1/4k3/8 w - - 0 1'
  const whiteOnWall =
    '8/8/6B1/6B1/8/8/4k3/2K5 w - - 0 1'
  const whiteBeyondWall =
    'K7/8/6B1/6B1/8/8/4k3/8 w - - 0 1'

  for (const transform of SQUARE_TRANSFORMS) {
    const insideFen = transformFen(whiteInside, transform)
    const onWallFen = transformFen(whiteOnWall, transform)
    const beyondWallFen = transformFen(whiteBeyondWall, transform)

    assert.ok(getTwoBishopsWalls(insideFen).length > 0, transform.name)
    assert.equal(getTwoBishopsPhaseLabel(insideFen), '2/2', transform.name)
    assert.equal(getTwoBishopsPhaseLabel(onWallFen), '2/2', transform.name)
    assert.equal(getTwoBishopsPhaseLabel(beyondWallFen), '2/2', transform.name)
  }
})

test('Phase 2 requires a functional wall at least four diagonals from its corner', () => {
  const phaseTwo = '2K5/8/6B1/6B1/8/8/4k3/8 w - - 0 1'
  const phaseOne = '5B1k/7B/8/8/3K4/8/8/8 w - - 0 1'

  for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(
      getTwoBishopsPhaseLabel(transformFen(phaseTwo, transform)),
      '2/2',
      transform.name,
    )
    assert.equal(
      getTwoBishopsPhaseLabel(transformFen(phaseOne, transform)),
      '1/2',
      transform.name,
    )
  }
})

test('Rule AB measures White king distance to the resulting outer wall', () => {
  const fen = '8/8/8/8/5K2/5B2/8/4Bk2 w - - 0 1'
  const onOuterWall = scoreTwoBishopsWhiteMove(fen, 'Kg4')
  const oneStepAway = scoreTwoBishopsWhiteMove(fen, 'Kf5')
  const destroysWall = scoreTwoBishopsWhiteMove(fen, 'Be4')

  assert.equal(onOuterWall.ruleABApplies, true)
  assert.equal(onOuterWall.ruleABPenalty, 0)
  assert.equal(oneStepAway.ruleABPenalty, 1)
  assert.equal(destroysWall.ruleABPenalty, 8)
})

test('Rule AB measures the outer wall of the smallest Black area', () => {
  const fen = '8/8/8/7K/8/B7/k7/3B4 w - - 0 1'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bc1').ruleABPenalty, 4)
})

test('Rule AB is excluded in Phase 2 and respects every board symmetry', () => {
  const phaseTwoFen = '2K5/8/6B1/6B1/8/8/4k3/8 w - - 0 1'
  assert.equal(
    scoreTwoBishopsWhiteMove(phaseTwoFen, 'Bh7').ruleABApplies,
    false,
  )

  const fen = '8/8/8/8/5K2/5B2/8/4Bk2 w - - 0 1'
  const move = getChess(fen).move('Kg4')
  assert.ok(move)
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const transformedMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(move.from, transform) &&
          to === transformSquare(move.to, transform),
      )
    assert.ok(transformedMove, transform.name)
    const score = scoreTwoBishopsWhiteMove(
      transformedFen,
      transformedMove.san,
    )
    assert.equal(score.ruleABApplies, true, transform.name)
    assert.equal(score.ruleABPenalty, 0, transform.name)
  }
})

test('dormant Rule W1 evaluates resulting wall eligibility', () => {
  const fen = '8/8/8/8/8/5K1k/3B4/3B4 w - - 2 2'
  const cornerKnightSquare = scoreTwoBishopsWhiteMove(fen, 'Kf2')
  const fartherSquare = scoreTwoBishopsWhiteMove(fen, 'Kf4')

  assert.equal(cornerKnightSquare.ruleW1Applies, true)
  assert.equal(cornerKnightSquare.ruleW1Penalty, 0)
  assert.equal(fartherSquare.ruleW1Applies, true)
  assert.equal(fartherSquare.ruleW1Penalty, 2)
})

test("dormant Rule W1 accepts walls containing White's king", () => {
  const fen = '8/8/8/8/7k/5K2/3B4/3B4 w - - 2 2'
  const withinTwo = scoreTwoBishopsWhiteMove(fen, 'Kf2')
  const beyondTwo = scoreTwoBishopsWhiteMove(fen, 'Ke3')

  assert.equal(withinTwo.ruleW1Applies, true)
  assert.equal(withinTwo.ruleW1BlackDistancePenalty, 0)
  assert.equal(beyondTwo.ruleW1Applies, true)
  assert.equal(beyondTwo.ruleW1BlackDistancePenalty, 1)
})

test('Rule W1 does not activate while entering Phase 2 from Phase 1', () => {
  const fen = '8/8/8/7B/6K1/8/3B1k2/8 w - - 0 1'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kf4').ruleW1Applies, false)
})

test('Rule W1 ignores a looser complementary corner interpretation', () => {
  const fen = '8/8/6K1/8/8/7k/3B4/3B4 w - - 0 1'
  const towardWrongCorner = scoreTwoBishopsWhiteMove(fen, 'Kf7')

  assert.equal(towardWrongCorner.ruleW1Applies, true)
  assert.equal(towardWrongCorner.ruleW1Penalty, 17)
})

test('Rule W1 ignores inner-bishop screening and prefers the closer king', () => {
  const fen = '8/8/8/7B/5K2/8/3B2k1/8 w - - 2 2'
  const screened = scoreTwoBishopsWhiteMove(fen, 'Kg4')
  const unscreened = scoreTwoBishopsWhiteMove(fen, 'Ke3')

  assert.equal(screened.ruleW1ScreenPenalty, 1)
  assert.equal(screened.ruleW1Penalty, 1)
  assert.equal(unscreened.ruleW1ScreenPenalty, 0)
  assert.equal(unscreened.ruleW1Penalty, 2)
})

test('Rule W1 allows a king on the inner diagonal beyond the screened segment', () => {
  const fen = '8/8/8/7B/8/4K3/3B2k1/8 w - - 0 1'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Ke2').ruleW1ScreenPenalty, 0)
})

test('Rule W1 screen detection respects every board symmetry', () => {
  const fen = '8/8/8/7B/5K2/8/3B2k1/8 w - - 2 2'
  const move = getChess(fen).move('Kg4')
  assert.ok(move)

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const transformedMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(move.from, transform) &&
          to === transformSquare(move.to, transform),
      )
    assert.ok(transformedMove, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, transformedMove.san)
        .ruleW1ScreenPenalty,
      1,
      transform.name,
    )
  }
})

test('Rule W2 moves the inner-wall bishop furthest from Black', () => {
  const preferred = scoreTwoBishopsWhiteMove(RULE_W2_FEN, 'Bh5')
  const nearerInnerMove = scoreTwoBishopsWhiteMove(RULE_W2_FEN, 'Bg4')
  const outerBishopMove = scoreTwoBishopsWhiteMove(RULE_W2_FEN, 'Ba5')

  assert.equal(preferred.ruleW2Applies, true)
  assert.equal(preferred.ruleW2Penalty, 0)
  assert.equal(nearerInnerMove.ruleW2Penalty, 1)
  assert.equal(outerBishopMove.ruleW2Penalty, 1)

  const result = getChess(RULE_W2_FEN)
  result.move('Bh5')
  assert.ok(
    getTwoBishopsWalls(result.fen()).some(
      ({ corner, nearerDiagonal, fartherDiagonal, wallBishops }) =>
        corner === 'h1' &&
        nearerDiagonal.axis === 'difference' &&
        nearerDiagonal.index === 3 &&
        fartherDiagonal.axis === 'difference' &&
        fartherDiagonal.index === 2 &&
        wallBishops[0] === 'h5',
    ),
  )
})

test('Rule W2 requires opposition and respects every board symmetry', () => {
  assert.equal(
    scoreTwoBishopsWhiteMove(
      '8/8/8/5K2/8/8/3B1k2/3B4 w - - 0 1',
      'Bh5',
    ).ruleW2Applies,
    false,
  )

  const baseMove = getChess(RULE_W2_FEN).move('Bh5')
  assert.ok(baseMove)
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(RULE_W2_FEN, transform)
    const transformedMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(baseMove.from, transform) &&
          to === transformSquare(baseMove.to, transform),
      )
    assert.ok(transformedMove, transform.name)
    const score = scoreTwoBishopsWhiteMove(
      transformedFen,
      transformedMove.san,
    )
    assert.equal(score.ruleW2Applies, true, transform.name)
    assert.equal(score.ruleW2Penalty, 0, transform.name)
  }
})

test('Rule O rejects expanding an established wall into an escape', () => {
  const fen = '8/8/8/8/7k/5K2/2B5/2B5 w - - 0 1'
  const escaped = getChess(fen)
  escaped.move('Bd1')

  assert.ok(escaped.moves().includes('Kh5'))
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bd1').ruleOPenalty, 65)
  assert.ok(!getIdealTwoBishopsWhiteMoves(fen).includes('Bd1'))
})

test('Rule O requires a wall at least four diagonals from the corner', () => {
  const tinyWall = '5B1k/7B/8/8/3K4/8/8/8 w - - 0 1'
  const thresholdWall =
    '8/8/8/8/8/4K2k/4B3/4B3 b - - 0 1'
  assert.equal(getSmallestTwoBishopsWallArea(tinyWall, 1), 1)
  assert.equal(getSmallestTwoBishopsWallArea(tinyWall), null)
  assert.equal(getSmallestTwoBishopsWallArea(LOADED_WALL_FEN), 10)
  assert.ok(
    getTwoBishopsWalls(tinyWall).every(
      ({ cornerDiagonalDistance }) => cornerDiagonalDistance < 3,
    ),
  )
  assert.ok(
    getTwoBishopsWalls(thresholdWall).some(
      ({ cornerDiagonalDistance }) => cornerDiagonalDistance === 3,
    ),
  )
  assert.ok(
    getTwoBishopsWalls(LOADED_WALL_FEN).some(
      ({ cornerDiagonalDistance }) => cornerDiagonalDistance === 4,
    ),
  )
})

test('Rule O rejects the former three-diagonal Be2 wall', () => {
  const fen = '8/8/8/8/5K2/8/8/4BBk1 w - - 0 1'
  const undersized = getChess(fen)
  undersized.move('Bh3')
  const qualifying = getChess(fen)
  qualifying.move('Be2')

  assert.ok(
    getTwoBishopsWalls(undersized.fen()).every(
      ({ areaSquares, cornerDiagonalDistance }) =>
        areaSquares.length !== 3 || cornerDiagonalDistance === 2,
    ),
  )
  assert.equal(getSmallestTwoBishopsWallArea(undersized.fen()), null)
  assert.equal(getSmallestTwoBishopsWallArea(qualifying.fen()), 6)
  assert.ok(!getIdealTwoBishopsWhiteMoves(fen).includes('Be2'))
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Be2').ruleOPenalty, 65)
})

test('a separated three-diagonal corner wall still rejects Kf4', () => {
  const fen = '8/8/8/5K2/8/8/4B3/4B2k w - - 0 1'
  const rejectedMove = getChess(fen).move('Kf4')
  assert.ok(rejectedMove)
  const result = getChess(fen)
  result.move('Kf4')
  assert.ok(
    getTwoBishopsWalls(result.fen()).some(
      ({ areaSquares, corner, cornerDiagonalDistance, fartherDiagonal, nearerDiagonal }) =>
        corner === 'h1' &&
        cornerDiagonalDistance === 3 &&
        areaSquares.length === 6 &&
        nearerDiagonal.axis === 'difference' &&
        nearerDiagonal.index === 4 &&
        fartherDiagonal.axis === 'difference' &&
        fartherDiagonal.index === 3,
    ),
  )
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kf4').ruleOPenalty, 65)

  const preferredMove = getChess(fen).move('Kg4')
  assert.ok(preferredMove)

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const expected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(preferredMove.from, transform) &&
          to === transformSquare(preferredMove.to, transform),
      )
    assert.ok(expected, transform.name)
    assert.deepEqual(
      getIdealTwoBishopsWhiteMoves(transformedFen),
      [expected.san],
      transform.name,
    )
  }
})

test('Rule N recognizes the forced checking shrink', () => {
  assert.deepEqual(getRuleNPreferredMoves(RULE_N_FEN), ['Bc4+'])
})

test('Rule N rejects a check that leaves the tightest wall unchanged', () => {
  const fen = '8/8/8/8/8/8/4K3/3BB1k1 w - - 0 1'
  assert.ok(!getRuleNPreferredMoves(fen).includes('Bf2+'))
})

test('Rule N requires Manhattan distance 4 from the wall corner', () => {
  assert.deepEqual(getRuleNPreferredMoves(RULE_N_DISTANCE_TWO_FEN), [])
  assert.deepEqual(getRuleNPreferredMoves(RULE_N_DISTANCE_THREE_FEN), [])
  assert.deepEqual(getRuleNPreferredMoves(RULE_N_DISTANCE_FOUR_FEN), [
    'Bf3+',
  ])

  const acceptedMove = getChess(RULE_N_DISTANCE_FOUR_FEN).move('Bf3+')
  assert.ok(acceptedMove)
  for (const transform of SQUARE_TRANSFORMS) {
    assert.deepEqual(
      getRuleNPreferredMoves(
        transformFen(RULE_N_DISTANCE_TWO_FEN, transform),
      ),
      [],
      transform.name,
    )
    assert.deepEqual(
      getRuleNPreferredMoves(
        transformFen(RULE_N_DISTANCE_THREE_FEN, transform),
      ),
      [],
      transform.name,
    )
    const transformedFen = transformFen(
      RULE_N_DISTANCE_FOUR_FEN,
      transform,
    )
    const transformedMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(acceptedMove.from, transform) &&
          to === transformSquare(acceptedMove.to, transform),
      )
    assert.ok(transformedMove, transform.name)
    assert.ok(
      getRuleNPreferredMoves(transformedFen).includes(transformedMove.san),
      transform.name,
    )
  }
})

test('Rule N rejects the supplied distance-three Be1 check', () => {
  const fen = '8/8/8/5K2/7k/8/3B4/3B4 w - - 0 1'
  assert.ok(!getRuleNPreferredMoves(fen).includes('Be1+'))
})

test('wall and Rule N geometry rotate and reflect', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const wallFen = transformFen(LOADED_WALL_FEN, transform)
    assert.ok(
      getTwoBishopsWalls(wallFen).some(
        ({ areaSquares, corner, escapeSquare }) =>
          areaSquares.length === 10 &&
          corner === transformSquare('h8', transform) &&
          escapeSquare === transformSquare('f5', transform),
      ),
      transform.name,
    )

    const ruleNFen = transformFen(RULE_N_FEN, transform)
    const expectedMove = getChess(ruleNFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare('d3', transform) &&
          to === transformSquare('c4', transform),
      )
    assert.ok(expectedMove, transform.name)
    assert.ok(
      getRuleNPreferredMoves(ruleNFen).includes(expectedMove.san),
      transform.name,
    )
  }
})

test('Rule WY identifies the other opposition square', () => {
  assert.deepEqual(getRuleWYPreferredMoves(RULE_WY_FEN), ['Bh4'])
  assert.equal(scoreTwoBishopsWhiteMove(RULE_WY_FEN, 'Bh4').ruleWYPenalty, 0)

  const move = getChess(RULE_WY_FEN).move('Bh4')
  assert.ok(move)
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(RULE_WY_FEN, transform)
    const transformedMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(move.from, transform) &&
          to === transformSquare(move.to, transform),
      )
    assert.ok(transformedMove, transform.name)
    assert.deepEqual(
      getRuleWYPreferredMoves(transformedFen),
      [transformedMove.san],
      transform.name,
    )
  }
})

test('Rule WY requires Black on the edge and a preserved wall', () => {
  assert.deepEqual(
    getRuleWYPreferredMoves('8/8/8/8/8/5K2/4B1k1/8 w - - 0 1'),
    [],
  )
  assert.deepEqual(
    getRuleWYPreferredMoves('8/8/8/8/8/5K2/4BBk1/8 w - - 0 1'),
    [],
  )
})

test('Rule W counts the post-move bishop distances at the threshold', () => {
  assert.equal(scoreTwoBishopsWhiteMove(LOADED_WALL_FEN, 'Be6').ruleWPenalty, 2)
  assert.equal(scoreTwoBishopsWhiteMove(LOADED_WALL_FEN, 'Bd8').ruleWPenalty, 0)
})

test('Rule W applies only when White leaves the resulting position in Phase 1', () => {
  const phaseOneFen = '6k1/8/8/8/4K3/8/2B5/B7 w - - 0 1'
  const remainsPhaseOne = getChess(phaseOneFen)
  remainsPhaseOne.move('Bd1')

  assert.equal(getTwoBishopsPhaseLabel(remainsPhaseOne.fen()), '1/2')
  assert.equal(
    scoreTwoBishopsWhiteMove(phaseOneFen, 'Bd1').ruleWApplies,
    true,
  )
  const phaseTwoFen = '2K5/8/6B1/6B1/8/8/4k3/8 w - - 0 1'
  assert.equal(getTwoBishopsPhaseLabel(phaseTwoFen), '2/2')
  assert.equal(
    scoreTwoBishopsWhiteMove(phaseTwoFen, 'Bh7').ruleWApplies,
    false,
  )
})

test('Rule W3 prefers the tightest Phase 1 wall outer bishop off the edge', () => {
  const fen = '6k1/8/4KBB1/8/8/8/8/8 w - - 0 1'
  const offEdge = scoreTwoBishopsWhiteMove(fen, 'Be7')
  const onEdge = scoreTwoBishopsWhiteMove(fen, 'Bd8')

  assert.equal(offEdge.ruleW3Applies, true)
  assert.equal(offEdge.ruleW3Penalty, 0)
  assert.equal(onEdge.ruleW3Applies, true)
  assert.equal(onEdge.ruleW3Penalty, 1)

  const noWallFen = '6k1/8/8/8/4K3/8/2B5/B7 w - - 0 1'
  assert.equal(
    scoreTwoBishopsWhiteMove(noWallFen, 'Bd1').ruleW3Applies,
    false,
  )

  const phaseTwoFen = '8/8/8/8/k7/2KB4/3B4/8 w - - 56 29'
  assert.equal(
    scoreTwoBishopsWhiteMove(phaseTwoFen, 'Kc2').ruleW3Applies,
    false,
  )
})

test('Rule W3 outer-wall edge scoring rotates and reflects', () => {
  const fen = '6k1/8/4KBB1/8/8/8/8/8 w - - 0 1'
  const sourceMove = getChess(fen).move('Be7')
  assert.ok(sourceMove)

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const transformedMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    assert.ok(transformedMove, transform.name)
    const score = scoreTwoBishopsWhiteMove(
      transformedFen,
      transformedMove.san,
    )
    assert.equal(score.ruleW3Applies, true, transform.name)
    assert.equal(score.ruleW3Penalty, 0, transform.name)
  }
})

test('Rule O rejects the former three-diagonal Bh4 wall', () => {
  const fen = '8/4B3/8/8/8/5K2/8/3B2k1 w - - 0 1'
  const result = getChess(fen)
  result.move('Bh4')
  assert.equal(getSmallestTwoBishopsWallArea(result.fen()), 6)
  const score = scoreTwoBishopsWhiteMove(fen, 'Bh4')
  assert.equal(score.ruleOApplies, true)
  assert.equal(score.ruleOPenalty, 65)
})

test('Rule O recognizes a bishop occupying its wall square', () => {
  const result = getChess(RULE_O_OCCUPIED_WALL_FEN)
  result.move('Bg5+')

  assert.equal(getSmallestTwoBishopsWallArea(result.fen()), 10)
  assert.ok(
    getTwoBishopsWalls(result.fen()).some(
      ({ fartherDiagonal, nearerDiagonal, wallBishops }) =>
        fartherDiagonal.axis === 'difference' &&
        fartherDiagonal.index === 2 &&
        nearerDiagonal.axis === 'difference' &&
        nearerDiagonal.index === 3 &&
        wallBishops.includes('g5'),
    ),
  )
})

test('four-diagonal Rule O rejects a wall below its threshold', () => {
  const fen = '8/8/8/8/8/5K1k/4B3/4B3 w - - 0 1'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bd2').ruleOPenalty, 10)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bd1').ruleOPenalty, 65)
})

test('occupied Rule O wall geometry rotates and reflects', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(RULE_O_OCCUPIED_WALL_FEN, transform)
    const firstMove = getChess(fen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare('h6', transform) &&
          to === transformSquare('g5', transform),
      )
    assert.ok(firstMove, transform.name)
    const expectedMove = getChess(fen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare('e2', transform) &&
          to === transformSquare('d1', transform),
      )
    assert.ok(expectedMove, transform.name)
    const expectedScore = scoreTwoBishopsWhiteMove(fen, expectedMove.san)
    const minimumRuleOPenalty = Math.min(
      ...getChess(fen)
        .moves()
        .map((san) => scoreTwoBishopsWhiteMove(fen, san).ruleOPenalty),
    )
    assert.equal(expectedScore.ruleOApplies, true, transform.name)
    assert.equal(
      expectedScore.ruleOPenalty,
      minimumRuleOPenalty,
      transform.name,
    )

    const reply = getChess(fen)
    reply.move(firstMove.san)
    const blackMove = reply
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare('h4', transform) &&
          to === transformSquare('h3', transform),
      )
    assert.ok(blackMove, transform.name)
    reply.move(blackMove.san)

    const expectedMoves = [['g5', 'h6']].map(([from, to]) => {
      const expected = reply
        .moves({ verbose: true })
        .find(
          (move) =>
            move.from === transformSquare(from as Square, transform) &&
            move.to === transformSquare(to as Square, transform),
        )
      assert.ok(expected, transform.name)
      return expected.san
    })
    for (const expectedMove of expectedMoves) {
      assert.equal(
        scoreTwoBishopsWhiteMove(reply.fen(), expectedMove).ruleOPenalty,
        10,
        transform.name,
      )
    }
  }
})
