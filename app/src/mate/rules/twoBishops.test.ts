import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  SQUARE_TRANSFORMS,
  getChess,
  transformFen,
  transformSquare,
} from '../chess'
import {
  compareTwoBishopsBlackScores,
  getMateRuleSet,
  getProximateBishopWall,
  getTwoBishopsMatingPositionSquares,
  getTwoBishopsPhaseLabel,
  isTwoBishopsPhaseTwoPosition,
  scoreTwoBishopsBlackMove,
  scoreTwoBishopsWhiteMove,
  twoBishopsRuleSet,
  twoBishopsWhiteRules,
} from './index'

const WHITE_RULE_IDS = [
  'mate',
  'bishops safe',
  'no stalemate',
  'rule pp',
  'rule p',
  'rule q',
  'rule r',
  'rule s',
  'king closer',
] as const

test('Two Bishops exposes only the six requested specific rules', () => {
  assert.deepEqual(
    twoBishopsWhiteRules.map(({ id }) => id),
    WHITE_RULE_IDS,
  )
  assert.deepEqual(
    twoBishopsWhiteRules.map(({ shortLabel, helpText }) => ({
      shortLabel,
      helpText,
    })),
    [
      { shortLabel: 'mate', helpText: '' },
      { shortLabel: 'pieces safe', helpText: '' },
      { shortLabel: 'no stalemate', helpText: '' },
      {
        shortLabel: 'rule pp',
        helpText:
          'When the kings are in opposition, use a bishop to control the inward flank square.',
      },
      {
        shortLabel: 'rule p',
        helpText:
          "If Rule pp is satisfied, check the king, only from the same side of White's king as the other bishop.",
      },
      {
        shortLabel: 'rule q',
        helpText:
          "When the kings are a knight's move apart, and a bishop controls the square in opposition to White's king, take opposition.",
      },
      {
        shortLabel: 'rule r',
        helpText:
          "When the kings are a knight's move apart, and a bishop controls the square a knight's move from White's king and 2 squares from Black's king, and a bishop can control the diagonal containing the squares adjacent to the kings and also edge adjacent to that first bishop-controlled square, take opposition.",
      },
      {
        shortLabel: 'rule s',
        helpText:
          "When the kings are a knight's move apart, use a bishop to control the flank square. The flank square is the square adjacent to Black's king and also a knight's move from White's king.",
      },
      {
        shortLabel: 'king closer',
        helpText:
          "Bring White's king closer to Black's king, preferring proximity to the the middle 16 squares.",
      },
    ],
  )
  assert.deepEqual(
    getMateRuleSet('two-bishops').whiteRuleDescriptions.map(({ id }) => id),
    WHITE_RULE_IDS,
  )
  assert.equal(twoBishopsRuleSet.whiteMoveOverride, undefined)
  for (const rule of twoBishopsWhiteRules) {
    if (rule.id.startsWith('rule ')) {
      assert.equal(typeof rule.applies, 'function')
      assert.equal(typeof rule.compare, 'function')
      assert.equal(rule.subpriorities, undefined)
    } else if (rule.id === 'king closer') {
      assert.equal(rule.applies, undefined)
      assert.equal(typeof rule.compare, 'function')
      assert.equal(rule.subpriorities, undefined)
    } else {
      assert.equal(rule.applies, undefined)
      assert.equal(rule.subpriorities, undefined)
    }
  }
})

test('Two Bishops removes legacy strategy notes and keeps the Rule S diagram', () => {
  const help = getMateRuleSet('two-bishops').help
  assert.deepEqual(help.notes, [])
  assert.deepEqual(help.noteBoards.map(({ id }) => id), [
    'bishop-rule-s',
  ])
  assert.deepEqual(help.noteBoards[0]?.highlights, [
    { square: 'c3', kind: 'key' },
  ])
  assert.deepEqual(help.noteBoards[0]?.arrows, [
    { from: 'h4', to: 'f6' },
  ])
})

 test('the prepared Two Bishops batch matches public single-move scores', () => {
  const fen = '8/8/8/3KB3/4B2k/8/8/8 w - - 18 10'
  const moves = getChess(fen).moves()
  const batch = twoBishopsRuleSet.scoreWhiteCandidates?.(fen, moves)
  assert.ok(batch)
  assert.deepEqual(
    batch,
    moves.map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    })),
  )
})

test('proximate wall matches the exact symmetric twelve-square stencil', () => {
  const bishops = ['d6', 'd7'] as const
  const right = ['f6', 'f7', 'g5', 'g6', 'g7', 'g8'] as const
  const left = ['b6', 'b7', 'a5', 'a6', 'a7', 'a8'] as const
  for (const square of right) {
    assert.deepEqual(getProximateBishopWall(bishops, square), {
      moatAxis: 'file',
      moatIndex: 4,
    })
  }
  for (const square of left) {
    assert.deepEqual(getProximateBishopWall(bishops, square), {
      moatAxis: 'file',
      moatIndex: 2,
    })
  }
  for (const square of ['d4', 'e6', 'f5', 'f8', 'g4'] as const) {
    assert.equal(getProximateBishopWall(bishops, square), null, square)
  }

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedBishops = bishops.map((square) =>
      transformSquare(square, transform),
    )
    for (const square of [...right, ...left]) {
      assert.notEqual(
        getProximateBishopWall(
          transformedBishops,
          transformSquare(square, transform),
        ),
        null,
        `${transform.name} ${square}`,
      )
    }
  }

  assert.notEqual(
    getProximateBishopWall(['b3', 'b4'], 'd3'),
    null,
  )
})

test('mating position uses the displayed pair and its D4 equivalents', () => {
  assert.deepEqual(
    [...getTwoBishopsMatingPositionSquares('h8')].sort(),
    ['f7', 'f8', 'g6', 'h6'],
  )
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedCorner = transformSquare('h8', transform)
    const transformedSquares = new Set(
      getTwoBishopsMatingPositionSquares(transformedCorner),
    )
    for (const square of getTwoBishopsMatingPositionSquares('h8')) {
      assert.equal(
        transformedSquares.has(transformSquare(square, transform)),
        true,
        `${transformedCorner}: ${square}`,
      )
    }
  }
})

test('the final king closer metric permits screening a bishop', () => {
  const fen = '8/5k2/8/8/3K4/8/8/BB6 w - - 0 1'
  const screened = scoreTwoBishopsWhiteMove(fen, 'Ke5')
  const clear = scoreTwoBishopsWhiteMove(fen, 'Kd5')
  assert.equal(screened.kingCloserDistance, 5)
  assert.equal(clear.kingCloserDistance, 8)
})

test('rule pp uses a bishop to control the inward opposition flank square', () => {
  const fen = '8/8/4k3/8/4K3/8/7B/B7 w - - 0 1'
  const controlling = scoreTwoBishopsWhiteMove(fen, 'Bb8')
  const kingMove = scoreTwoBishopsWhiteMove(fen, 'Kf4')
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule pp')

  assert.equal(getMateRuleSet('two-bishops').phase(fen), '1/2')
  assert.equal(controlling.rulePPApplies, true)
  assert.equal(controlling.rulePPPenalty, 0)
  assert.equal(kingMove.rulePPApplies, true)
  assert.equal(kingMove.rulePPPenalty, 1)
  assert.ok(rule?.compare)
  assert.ok(rule.compare(controlling, kingMove) < 0)

  const sourceMove = getChess(fen).move('Bb8')
  assert.ok(sourceMove)
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
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
    assert.equal(score.rulePPApplies, true, transform.name)
    assert.equal(score.rulePPPenalty, 0, transform.name)
  }
})

test('rule pp is neutral without direct opposition', () => {
  const noOpposition = scoreTwoBishopsWhiteMove(
    '8/3B4/8/8/4K2B/8/3k4/8 w - - 0 1',
    'Bf6',
  )
  assert.equal(noOpposition.rulePPApplies, false)
  assert.equal(noOpposition.rulePPPenalty, 1)
})

test('rule p checks from the same side as the other bishop', () => {
  const fen = '3B4/8/8/8/8/5K1k/2B5/8 w - - 0 1'
  const sourceMove = getChess(fen).move('Bf5+')
  assert.ok(sourceMove)

  const score = scoreTwoBishopsWhiteMove(fen, sourceMove.san)
  assert.equal(score.rulePApplies, true)
  assert.equal(score.rulePPenalty, 0)
  assert.deepEqual(getMateRuleSet('two-bishops').idealWhiteMoves(fen), [
    'Bf5+',
  ])

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
    const transformedMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    assert.ok(transformedMove, transform.name)
    const transformedScore = scoreTwoBishopsWhiteMove(
      transformedFen,
      transformedMove.san,
    )
    assert.equal(transformedScore.rulePApplies, true, transform.name)
    assert.equal(transformedScore.rulePPenalty, 0, transform.name)
  }
})

test('rule q takes opposition when its prerequisite square is controlled', () => {
  const fen = '8/6BB/5K2/7k/8/8/8/8 w - - 0 1'
  const sourceMove = getChess(fen).move('Kf5')
  assert.ok(sourceMove)

  const score = scoreTwoBishopsWhiteMove(fen, sourceMove.san)
  assert.equal(score.ruleQApplies, true)
  assert.equal(score.ruleQPenalty, 0)
  assert.deepEqual(getMateRuleSet('two-bishops').idealWhiteMoves(fen), [
    'Kf5',
  ])

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
    const transformedMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    assert.ok(transformedMove, transform.name)
    const transformedScore = scoreTwoBishopsWhiteMove(
      transformedFen,
      transformedMove.san,
    )
    assert.equal(transformedScore.ruleQApplies, true, transform.name)
    assert.equal(transformedScore.ruleQPenalty, 0, transform.name)
  }
})

test('rule r recognizes its controlled-square and diagonal setup', () => {
  const fen = '8/7B/8/8/5B1K/5k2/8/8 w - - 0 1'
  const sourceMove = getChess(fen).move('Kh3')
  assert.ok(sourceMove)

  const score = scoreTwoBishopsWhiteMove(fen, sourceMove.san)
  assert.equal(score.ruleQApplies, false)
  assert.equal(score.ruleRApplies, true)
  assert.equal(score.ruleRPenalty, 0)

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
    const transformedMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    assert.ok(transformedMove, transform.name)
    const transformedScore = scoreTwoBishopsWhiteMove(
      transformedFen,
      transformedMove.san,
    )
    assert.equal(transformedScore.ruleQApplies, false, transform.name)
    assert.equal(transformedScore.ruleRApplies, true, transform.name)
    assert.equal(transformedScore.ruleRPenalty, 0, transform.name)
  }
})

test('rule s uses a bishop to control the knight-step flank square', () => {
  const fen = '8/3B4/8/8/4K2B/8/3k4/8 w - - 0 1'
  const blocking = scoreTwoBishopsWhiteMove(fen, 'Bf6')
  const kingMove = scoreTwoBishopsWhiteMove(fen, 'Kd4')
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule s')
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(blocking.ruleSApplies, true)
  assert.equal(blocking.ruleSPenalty, 0)
  assert.equal(kingMove.ruleSApplies, true)
  assert.equal(kingMove.ruleSPenalty, 1)
  assert.ok(rule?.compare)
  assert.ok(rule.compare(blocking, kingMove) < 0)

  const sourceMove = getChess(fen).move('Bf6')
  assert.ok(sourceMove)
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
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
    assert.equal(score.ruleSApplies, true, transform.name)
    assert.equal(score.ruleSPenalty, 0, transform.name)
  }
})

test('rule s is neutral without knight-separated kings', () => {
  const noTarget = scoreTwoBishopsWhiteMove(
    '8/3B4/8/8/4K2B/8/8/3k4 w - - 0 1',
    'Bf6',
  )
  assert.equal(noTarget.ruleSApplies, false)
  assert.equal(noTarget.ruleSPenalty, 1)
})

test('rule b is removed from the policy', () => {
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule b'),
    undefined,
  )
})

test('king closer uniquely minimizes squared Euclidean distance within its survivors', () => {
  const fen = '8/8/8/4BB2/6K1/8/5k2/8 w - - 34 18'
  const closest = scoreTwoBishopsWhiteMove(fen, 'Kf4')
  const farther = scoreTwoBishopsWhiteMove(fen, 'Kh3')
  assert.equal(closest.kingCloserDistance, 4)
  assert.equal(farther.kingCloserDistance, 5)
  const kingCloser = twoBishopsWhiteRules.find(({ id }) => id === 'king closer')
  assert.ok(kingCloser?.compare)
  assert.ok(kingCloser.compare(closest, farther) < 0)
})

test('king closer applies its distance and middle-sixteen priorities in Phase 1', () => {
  const fen = '3K4/1k1B4/3B4/8/8/8/8/8 w - - 4 3'
  const bishopMove = scoreTwoBishopsWhiteMove(fen, 'Bc5')
  const kingMove = scoreTwoBishopsWhiteMove(fen, 'Ke7')
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(bishopMove.kingCloserDistance, 5)
  assert.equal(bishopMove.kingCloserMiddleSixteenDistance, 2)
  assert.equal(kingMove.kingCloserDistance, 9)
  const kingCloser = twoBishopsWhiteRules.find(({ id }) => id === 'king closer')
  assert.equal(kingCloser?.applies, undefined)
  assert.ok(kingCloser?.compare)
  assert.ok(kingCloser.compare(bishopMove, kingMove) < 0)
})

test('king closer prefers proximity to the middle sixteen after distance ties', () => {
  const fen = '5k2/8/3K4/5BB1/8/8/8/8 w - - 0 1'
  const central = scoreTwoBishopsWhiteMove(fen, 'Ke5')
  const outside = scoreTwoBishopsWhiteMove(fen, 'Kc7')
  const fartherCentral = scoreTwoBishopsWhiteMove(fen, 'Kd5')
  const kingCloser = twoBishopsWhiteRules.find(({ id }) => id === 'king closer')
  assert.ok(kingCloser?.compare)

  assert.equal(central.kingCloserDistance, outside.kingCloserDistance)
  assert.equal(central.kingCloserMiddleSixteenDistance, 0)
  assert.equal(outside.kingCloserMiddleSixteenDistance, 1)
  assert.ok(kingCloser.compare(central, outside) < 0)
  assert.ok(kingCloser.compare(outside, fartherCentral) < 0)

  const sourceCentral = getChess(fen).move('Ke5')
  const sourceOutside = getChess(fen).move('Kc7')
  assert.ok(sourceCentral)
  assert.ok(sourceOutside)
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
    const transformedMoves = getChess(transformedFen).moves({ verbose: true })
    const transformedCentral = transformedMoves.find(
      ({ from, to }) =>
        from === transformSquare(sourceCentral.from, transform) &&
        to === transformSquare(sourceCentral.to, transform),
    )
    const transformedOutside = transformedMoves.find(
      ({ from, to }) =>
        from === transformSquare(sourceOutside.from, transform) &&
        to === transformSquare(sourceOutside.to, transform),
    )
    assert.ok(transformedCentral, transform.name)
    assert.ok(transformedOutside, transform.name)
    const centralScore = scoreTwoBishopsWhiteMove(
      transformedFen,
      transformedCentral.san,
    )
    const outsideScore = scoreTwoBishopsWhiteMove(
      transformedFen,
      transformedOutside.san,
    )
    assert.equal(
      centralScore.kingCloserDistance,
      outsideScore.kingCloserDistance,
      transform.name,
    )
    assert.ok(kingCloser.compare(centralScore, outsideScore) < 0, transform.name)
  }
})

test('king closer prefers the nearer side of the middle sixteen', () => {
  const fen = '5k2/8/7K/4BB2/8/8/8/8 w - - 0 1'
  const nearer = scoreTwoBishopsWhiteMove(fen, 'Kg6')
  const farther = scoreTwoBishopsWhiteMove(fen, 'Kh7')

  assert.equal(nearer.kingCloserDistance, farther.kingCloserDistance)
  assert.equal(nearer.kingCloserMiddleSixteenDistance, 1)
  assert.equal(farther.kingCloserMiddleSixteenDistance, 3)
  const kingCloser = twoBishopsWhiteRules.find(({ id }) => id === 'king closer')
  assert.ok(kingCloser?.compare)
  assert.ok(kingCloser.compare(nearer, farther) < 0)
})

test('king closer middle sixteen uses the inclusive c3-f6 boundary', () => {
  const lowBoundary = '8/7k/8/8/2K5/8/8/B2B4 w - - 0 1'
  assert.equal(
    scoreTwoBishopsWhiteMove(lowBoundary, 'Kc3')
      .kingCloserMiddleSixteenDistance,
    0,
  )
  assert.equal(
    scoreTwoBishopsWhiteMove(lowBoundary, 'Kb3')
      .kingCloserMiddleSixteenDistance,
    1,
  )

  const highBoundary = 'B2B4/8/8/5K2/8/8/8/k7 w - - 0 1'
  assert.equal(
    scoreTwoBishopsWhiteMove(highBoundary, 'Kf6')
      .kingCloserMiddleSixteenDistance,
    0,
  )
  assert.equal(
    scoreTwoBishopsWhiteMove(highBoundary, 'Kg6')
      .kingCloserMiddleSixteenDistance,
    1,
  )
})

test('king closer scores the resulting Phase 2 king position', () => {
  const fen = '8/3B4/8/8/8/4BK2/8/7k w - - 0 1'
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'king closer')
  const score = scoreTwoBishopsWhiteMove(fen, 'Kf2')

  assert.equal(isTwoBishopsPhaseTwoPosition(fen), true)
  assert.equal(rule?.applies, undefined)
  assert.equal(score.kingCloserDistance, 5)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Ke2').kingCloserDistance, 10)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bc8').kingCloserDistance, 8)
})

 test('mate, bishop safety, and stalemate remain mandatory', () => {
  const ruleSet = getMateRuleSet('two-bishops')

  const mateFen = '8/3B4/8/8/5B2/8/5K2/7k w - - 4 3'
  const mateMoves = ruleSet.idealWhiteMoves(mateFen)
  assert.ok(mateMoves.length > 0)
  for (const san of mateMoves) {
    const chess = getChess(mateFen)
    chess.move(san)
    assert.equal(chess.isCheckmate(), true, san)
  }

  const safetyFen = '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1'
  assert.equal(ruleSet.idealWhiteMoves(safetyFen).includes('Be6+'), false)
  assert.equal(
    scoreTwoBishopsWhiteMove(safetyFen, 'Be6+').bishopSafetyPenalty,
    1,
  )

  const stalemateFen = '8/8/8/1B6/8/8/2K5/k1B5 w - - 0 1'
  assert.equal(ruleSet.idealWhiteMoves(stalemateFen).includes('Bc4'), false)
  assert.equal(
    scoreTwoBishopsWhiteMove(stalemateFen, 'Bc4').stalematePenalty,
    1,
  )
})

test('Two Bishops recommendations are symmetric', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  for (const fen of [
    '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1',
    '8/8/8/1B6/8/8/2K5/k1B5 w - - 0 1',
    '8/2BB4/2K5/8/8/8/5k2/8 w - - 0 1',
    '8/2B5/2K5/5B2/8/4k3/8/8 w - - 2 2',
    '8/8/2K5/4BB2/8/5k2/8/8 w - - 4 3',
    '8/8/8/3KBB2/8/4k3/8/8 w - - 6 4',
    '8/8/8/4BB2/8/3K4/5k2/8 w - - 16 9',
    '2B5/8/8/8/7B/8/5K1k/8 w - - 2 2',
    '8/8/8/6BB/8/8/5K1k/8 w - - 2 2',
    '2B5/8/8/8/8/8/5K2/4B2k w - - 2 2',
    '8/3B4/8/8/7B/8/5K2/7k w - - 0 1',
  ]) {
    const expectedCount = ruleSet.idealWhiteMoves(fen).length
    for (const transform of SQUARE_TRANSFORMS) {
      const transformed = getChess(transformFen(fen, transform)).fen()
      assert.equal(
        ruleSet.idealWhiteMoves(transformed).length,
        expectedCount,
        transformed,
      )
    }
  }
})

test('White recommendations depend only on the board position', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const fresh = '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1'
  const old = '5Bk1/3B4/5K2/8/8/8/8/8 w - - 76 39'
  assert.deepEqual(ruleSet.idealWhiteMoves(fresh), ruleSet.idealWhiteMoves(old))
  assert.equal(
    ruleSet.currentWhiteHint(fresh)?.id,
    ruleSet.currentWhiteHint(old)?.id,
  )
})

test('Phase 2 requires a forced edge with kings exactly two Chebyshev steps apart', () => {
  const blackCanLeaveEdge = '8/8/8/8/5K2/7k/4B3/4B3 b - - 0 1'
  const blackForcedClear = '8/8/8/8/8/5K2/4B2k/4B3 b - - 0 1'
  const blackForcedOrthogonal = '8/8/8/8/8/8/3B1K1k/4B3 b - - 0 1'
  const blackForcedKingAdjacent = '8/8/8/8/8/6K1/4B2k/4B3 b - - 0 1'
  const blackForcedKingTooFar = '8/8/8/8/8/4K3/4B2k/4B3 b - - 0 1'
  const blackForcedWhiteOnOtherEdge =
    '8/8/8/8/K7/8/4B2k/4B3 b - - 0 1'
  const whiteCanEnterPhaseTwo = '8/8/8/8/5K2/7k/4B3/4B3 w - - 0 1'
  const whiteCannotClearEdge = '8/8/7K/8/8/8/4B2k/4B3 w - - 0 1'

  assert.equal(isTwoBishopsPhaseTwoPosition(blackCanLeaveEdge), false)
  assert.equal(isTwoBishopsPhaseTwoPosition(blackForcedClear), true)
  assert.equal(isTwoBishopsPhaseTwoPosition(blackForcedOrthogonal), true)
  assert.equal(getTwoBishopsPhaseLabel(blackForcedClear), '2/2')
  assert.equal(isTwoBishopsPhaseTwoPosition(blackForcedKingAdjacent), false)
  assert.equal(isTwoBishopsPhaseTwoPosition(blackForcedKingTooFar), false)
  assert.equal(getTwoBishopsPhaseLabel(blackForcedKingAdjacent), '1/2')
  assert.equal(
    isTwoBishopsPhaseTwoPosition(blackForcedWhiteOnOtherEdge),
    false,
  )
  assert.equal(isTwoBishopsPhaseTwoPosition(whiteCanEnterPhaseTwo), true)
  assert.equal(isTwoBishopsPhaseTwoPosition(whiteCannotClearEdge), false)

  for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(
      isTwoBishopsPhaseTwoPosition(
        getChess(transformFen(blackForcedClear, transform)).fen(),
      ),
      true,
      transform.name,
    )
  }
})

test('the supplied distant-king position remains Phase 1', () => {
  const source = '4k3/8/4BB2/8/8/5K2/8/8 w - - 0 1'
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Ke4')
  assert.ok(sourceMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const move = getChess(fen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    assert.ok(move, transform.name)
    assert.equal(ruleSet.phase(fen), '1/2', fen)
    const score = scoreTwoBishopsWhiteMove(fen, move.san)
    assert.equal(score.isPhaseTwoPosition, false, fen)
    assert.equal(score.sequesterApplies, false, fen)
    assert.notEqual(ruleSet.explainWhiteMove(fen, move.san)?.id, 'sequester')
  }
})

 test('Black captures before seeking the center or a bishop', () => {
  const fen = '6B1/8/8/8/3k4/2B5/8/K7 b - - 0 1'
  const capture = scoreTwoBishopsBlackMove(fen, 'Kxc3')
  const quiet = scoreTwoBishopsBlackMove(fen, 'Ke4')
  assert.ok(compareTwoBishopsBlackScores(capture, quiet) < 0)
  assert.ok(
    getMateRuleSet('two-bishops').blackCandidates(fen).idealMoves.includes(
      'Kxc3',
    ),
  )
})

test('Two Bishops has no concealed White strategy selector', () => {
  const source = readFileSync(new URL('./twoBishops.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(
    source,
    /edge finish|id: 'form wall'|shortLabel: 'form wall'|push with king|king approach|advance wall|getGuaranteedWallAdvance|corner(?:Setup|Drive|Turn)|followup|lookahead|whiteMoveOverride/,
  )
  assert.doesNotMatch(
    source,
    /forceOpposition|id: 'force opposition'|unmask(?:Applies|KingPenalty|BishopAdjacencyPenalty|CorneredBishopPenalty)|id: 'unmask'/,
  )
  assert.deepEqual(getMateRuleSet('two-bishops').help.blackPriorities, [
    "Take a piece when White isn't looking.",
    'Return to the previous board position when possible.',
    'Move toward the center.',
    'Move toward an unprotected bishop.',
  ])
})
