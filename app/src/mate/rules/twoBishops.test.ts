import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen } from '../chess'
import {
  compareTwoBishopsBlackScores,
  getMateRuleSet,
  getPhaseTwoCornerSupportDistance,
  getTwoBishopsKnightDistanceWaitingMoves,
  scoreTwoBishopsBlackMove,
  scoreTwoBishopsWhiteMove,
  twoBishopsWhiteRules,
} from './index'
import { getWhiteKingBishopScreeningPenalty } from './twoBishopsGeometry'

const SOURCE_COMMIT = '70704ecf25d6ee9e5c76a18f49e2a6fce409b728'

const WHITE_RULE_IDS = [
  'mate',
  'no stalemate',
  'bishops safe',
  'keep phase two',
  'waiting move',
  'corner support',
  'force opponent to take opposition',
  'take direct opposition',
  'push from controlled edge square',
  'force opponent toward corner',
  'check king',
  'bishops far from corner',
  'avoid bishop screening',
  'bishops together',
  'coordinate bishops',
  'king closer',
] as const

type WhiteParityFixture = {
  readonly category: string
  readonly fen: string
  readonly phase: '1/2' | '2/2'
  readonly idealMoves: readonly string[]
  readonly hint: (typeof WHITE_RULE_IDS)[number]
  readonly sampledMove: string
  readonly sampledReason: (typeof WHITE_RULE_IDS)[number]
  readonly idealBlackReplies: Readonly<Record<string, readonly string[]>>
}

// Literal outputs captured from chess420 Brain.tsx at SOURCE_COMMIT.
const WHITE_PARITY_FIXTURES: readonly WhiteParityFixture[] = [
  {
    category: 'immediate mate',
    fen: '8/8/K7/2B5/k7/8/4B3/8 w - - 2 2',
    phase: '1/2',
    idealMoves: ['Bd1#'],
    hint: 'mate',
    sampledMove: 'Ka7',
    sampledReason: 'mate',
    idealBlackReplies: { 'Bd1#': [] },
  },
  {
    category: 'ordinary confinement',
    fen: '8/3k4/8/8/1BB5/2K5/8/8 w - - 8 5',
    phase: '1/2',
    idealMoves: ['Bb5+'],
    hint: 'coordinate bishops',
    sampledMove: 'Kd4',
    sampledReason: 'coordinate bishops',
    idealBlackReplies: { 'Bb5+': ['Ke6'] },
  },
  {
    category: 'phase-two line waiting move',
    fen: '8/8/8/8/2K5/2B5/k1B5/8 w - - 0 1',
    phase: '2/2',
    idealMoves: ['Bd3'],
    hint: 'waiting move',
    sampledMove: 'Bd4',
    sampledReason: 'waiting move',
    idealBlackReplies: { Bd3: ['Ka3'] },
  },
  {
    category: 'phase-two knight-distance move by the corner',
    fen: '8/8/2B5/2B5/8/8/2K5/k7 w - - 40 21',
    phase: '2/2',
    idealMoves: ['Bd4+'],
    hint: 'waiting move',
    sampledMove: 'Be4',
    sampledReason: 'waiting move',
    idealBlackReplies: { 'Bd4+': ['Ka2'] },
  },
  {
    category: 'phase-two entry',
    fen: '8/8/8/3BB3/3K4/8/8/3k4 w - - 0 1',
    phase: '1/2',
    idealMoves: ['Kd3'],
    hint: 'keep phase two',
    sampledMove: 'Bc6',
    sampledReason: 'keep phase two',
    idealBlackReplies: { Kd3: ['Ke1'] },
  },
  {
    category: 'phase-two retention and entry',
    fen: '8/1B6/8/6B1/8/5K2/7k/8 w - - 0 1',
    phase: '2/2',
    idealMoves: ['Kf2'],
    hint: 'corner support',
    sampledMove: 'Ba8',
    sampledReason: 'corner support',
    idealBlackReplies: { Kf2: ['Kh3'] },
  },
  {
    category: 'knight-distance waiting before direct opposition',
    fen: '8/7k/5K2/8/6B1/6B1/8/8 w - - 64 33',
    phase: '2/2',
    idealMoves: ['Bf5+'],
    hint: 'check king',
    sampledMove: 'Kf7',
    sampledReason: 'waiting move',
    idealBlackReplies: { 'Bf5+': ['Kh6'] },
  },
  {
    category: 'controlled-edge push',
    fen: '1B6/8/2B5/k1K5/8/8/8/8 w - - 46 24',
    phase: '2/2',
    idealMoves: ['Bb7'],
    hint: 'push from controlled edge square',
    sampledMove: 'Bc7+',
    sampledReason: 'push from controlled edge square',
    idealBlackReplies: { Bb7: ['Ka4'] },
  },
  {
    category: 'checking priority',
    fen: '8/k1K5/8/4B3/2B5/8/8/8 w - - 32 17',
    phase: '2/2',
    idealMoves: ['Bd4+'],
    hint: 'check king',
    sampledMove: 'Bc3',
    sampledReason: 'check king',
    idealBlackReplies: { 'Bd4+': ['Ka8'] },
  },
  {
    category: 'bishop safety',
    fen: '7B/4k3/K5B1/8/8/8/8/8 w - - 0 1',
    phase: '1/2',
    idealMoves: ['Bg7'],
    hint: 'coordinate bishops',
    sampledMove: 'Bf6+',
    sampledReason: 'bishops safe',
    idealBlackReplies: { Bg7: ['Ke6'] },
  },
  {
    category: 'stalemate avoidance',
    fen: '8/8/8/7k/4B3/6BK/8/8 w - - 0 1',
    phase: '1/2',
    idealMoves: ['Bf3+'],
    hint: 'coordinate bishops',
    sampledMove: 'Bf4',
    sampledReason: 'no stalemate',
    idealBlackReplies: { 'Bf3+': ['Kg5'] },
  },
]

test('Two Bishops exposes the literal ordered chess420 priorities', () => {
  const ruleSet = getMateRuleSet('two-bishops')

  assert.deepEqual(
    twoBishopsWhiteRules.map(({ id }) => id),
    WHITE_RULE_IDS,
  )
  assert.deepEqual(
    ruleSet.whiteRuleDescriptions.map(({ id }) => id),
    [
      WHITE_RULE_IDS[0],
      WHITE_RULE_IDS[2],
      WHITE_RULE_IDS[1],
      ...WHITE_RULE_IDS.slice(3),
    ],
  )
  const screeningRule = twoBishopsWhiteRules.find(
    ({ id }) => id === 'avoid bishop screening',
  )
  assert.deepEqual(
    screeningRule && {
      id: screeningRule.id,
      shortLabel: screeningRule.shortLabel,
      helpText: screeningRule.helpText,
    },
    {
      id: 'avoid bishop screening',
      shortLabel: 'avoid bishop screening',
      helpText:
        "Keep White's king from screening the bishops from Black's king.",
    },
  )
  const coordinateRule = twoBishopsWhiteRules.find(
    ({ id }) => id === 'coordinate bishops',
  )
  assert.deepEqual(
    coordinateRule && {
      id: coordinateRule.id,
      shortLabel: coordinateRule.shortLabel,
      helpText: coordinateRule.helpText,
    },
    {
      id: 'coordinate bishops',
      shortLabel: 'coordinate bishops',
      helpText: "Force Black's king away from the bishops.",
    },
  )
  const kingCloserRule = twoBishopsWhiteRules.find(
    ({ id }) => id === 'king closer',
  )
  assert.deepEqual(
    kingCloserRule && {
      id: kingCloserRule.id,
      shortLabel: kingCloserRule.shortLabel,
      helpText: kingCloserRule.helpText,
    },
    {
      id: 'king closer',
      shortLabel: 'king closer',
      helpText: "Minimize distance from White's king to Black's king.",
    },
  )
})

test('Two Bishops screening counts only White king between Black and bishop', () => {
  assert.equal(
    getWhiteKingBishopScreeningPenalty(
      '7B/8/8/B7/8/K7/8/k7 w - - 0 1',
    ),
    1,
  )
  assert.equal(
    getWhiteKingBishopScreeningPenalty(
      '7B/8/8/K7/8/B7/8/k7 w - - 0 1',
    ),
    0,
  )
})

test('Two Bishops coordination brings the bishop wall toward Black', () => {
  const fen = '8/3k4/8/8/1BB5/2K5/8/8 w - - 8 5'
  const coordinated = scoreTwoBishopsWhiteMove(fen, 'Bb5+')
  const farther = scoreTwoBishopsWhiteMove(fen, 'Kb3')
  const rule = twoBishopsWhiteRules.find(
    ({ id }) => id === 'coordinate bishops',
  )

  assert.ok(
    coordinated.bishopBlackKingDistance < farther.bishopBlackKingDistance,
  )
  assert.ok(rule?.compare)
  assert.ok(rule.compare(coordinated, farther) < 0)
})

test("Two Bishops king closer minimizes the kings' move distance", () => {
  const fen = '8/7k/8/8/8/2BB4/8/K7 w - - 0 1'
  const closer = scoreTwoBishopsWhiteMove(fen, 'Kb2')
  const farther = scoreTwoBishopsWhiteMove(fen, 'Ka2')
  const rule = twoBishopsWhiteRules.find(
    ({ id }) => id === 'king closer',
  )

  assert.equal(closer.whiteBlackKingDistance, 6)
  assert.equal(farther.whiteBlackKingDistance, 7)
  assert.ok(rule?.compare)
  assert.ok(rule.compare(closer, farther) < 0)
})

test(`Two Bishops White parity matches chess420 ${SOURCE_COMMIT}`, () => {
  const ruleSet = getMateRuleSet('two-bishops')

  for (const fixture of WHITE_PARITY_FIXTURES) {
    assert.equal(ruleSet.phase(fixture.fen), fixture.phase, fixture.category)
    assert.deepEqual(
      ruleSet.idealWhiteMoves(fixture.fen),
      fixture.idealMoves,
      fixture.category,
    )
    assert.equal(
      ruleSet.currentWhiteHint(fixture.fen)?.id,
      fixture.hint,
      fixture.category,
    )
    assert.equal(
      ruleSet.explainWhiteMove(fixture.fen, fixture.sampledMove)?.id,
      fixture.sampledReason,
      `${fixture.category}: ${fixture.sampledMove}`,
    )

    for (const [whiteSan, expectedReplies] of Object.entries(
      fixture.idealBlackReplies,
    )) {
      const afterWhite = getChess(fixture.fen)
      assert.ok(afterWhite.move(whiteSan), `${fixture.category}: ${whiteSan}`)
      assert.deepEqual(
        ruleSet.blackCandidates(afterWhite.fen()).idealMoves,
        expectedReplies,
        `${fixture.category}: replies after ${whiteSan}`,
      )
    }
  }
})

test('Two Bishops phase is White-turn-only and reports lost material', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const phaseTwo = '8/8/8/8/2K5/2B5/k1B5/8 w - - 0 1'

  assert.equal(ruleSet.phase(phaseTwo), '2/2')
  assert.equal(ruleSet.phase(phaseTwo.replace(' w ', ' b ')), '1/2')
  assert.equal(
    ruleSet.phase('8/8/8/8/2K5/2B5/k7/8 w - - 0 1'),
    '0/2',
  )
})

test('Two Bishops phase two lets a corner continue toward White on either edge', () => {
  const start = '8/8/8/8/8/2K5/5BB1/1k6 w - - 0 1'
  const afterWhite = getChess(start)
  assert.ok(afterWhite.move('Bf3'))
  const score = scoreTwoBishopsWhiteMove(start, 'Bf3')
  assert.equal(score.phaseTwoStayPhaseTwoPenalty, 0)

  const afterBlack = getChess(afterWhite.fen())
  assert.ok(afterBlack.move('Ka1'))
  const cornerFen = afterBlack.fen()
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(
      ruleSet.phase(transformFen(cornerFen, transform)),
      '2/2',
      transform.name,
    )
  }
})

test('Two Bishops uses a centerward waiting move at knight king distance', () => {
  const fen = '8/8/8/8/8/2K5/5BB1/1k6 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.deepEqual(getTwoBishopsKnightDistanceWaitingMoves(fen), [
    { from: 'f2', to: 'e3' },
    { from: 'g2', to: 'f3' },
  ])
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bf3'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'bishops together')
  assert.equal(ruleSet.explainWhiteMove(fen, 'Kb3')?.id, 'waiting move')
  assert.equal(ruleSet.explainWhiteMove(fen, 'Be3')?.id, 'bishops together')

  for (const transform of SQUARE_TRANSFORMS) {
    const transformed = transformFen(fen, transform)
    assert.equal(
      getTwoBishopsKnightDistanceWaitingMoves(transformed).length,
      2,
      transform.name,
    )
    assert.equal(
      ruleSet.idealWhiteMoves(transformed).length,
      1,
      transform.name,
    )
  }
})

test('Two Bishops waiting move falls back when no safe centerward move exists', () => {
  const fen = '8/8/8/8/8/1K6/5BB1/2k5 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.deepEqual(getTwoBishopsKnightDistanceWaitingMoves(fen), [])
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kc3'])
})

test('Two Bishops corner support is current-position geometry', () => {
  const cornerFen = '7k/8/3B1K2/3B4/8/8/8/8 w - - 0 1'
  const adjacentFen = '8/5K1k/3B4/3B4/8/8/8/8 w - - 2 2'
  const outsideCornerArea = '8/5K2/3B3k/8/4B3/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.deepEqual(ruleSet.idealWhiteMoves(cornerFen), ['Kf7'])
  assert.equal(
    scoreTwoBishopsWhiteMove(cornerFen, 'Kf7')
      .phaseTwoCornerSupportDistance,
    0,
  )
  assert.equal(
    scoreTwoBishopsWhiteMove(cornerFen, 'Be6')
      .phaseTwoCornerSupportDistance,
    1,
  )
  assert.equal(ruleSet.explainWhiteMove(cornerFen, 'Be6')?.id, 'corner support')
  assert.equal(
    getPhaseTwoCornerSupportDistance(adjacentFen, adjacentFen),
    0,
  )
  assert.equal(
    getPhaseTwoCornerSupportDistance(outsideCornerArea, outsideCornerArea),
    null,
  )

  for (const transform of SQUARE_TRANSFORMS) {
    const transformed = transformFen(cornerFen, transform)
    const idealMoves = ruleSet.idealWhiteMoves(transformed)
    assert.equal(idealMoves.length, 1, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(transformed, idealMoves[0]!)
        .phaseTwoCornerSupportDistance,
      0,
      transform.name,
    )
  }
})

test('Two Bishops keeps knight-distance waiting ahead of corner support', () => {
  const fen = '8/8/8/8/8/2K5/5BB1/1k6 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bf3'])
  assert.equal(ruleSet.explainWhiteMove(fen, 'Kb3')?.id, 'waiting move')
})

test('Two Bishops phase two counts one-edge-step opposition pressure', () => {
  const fen = '8/8/8/B7/B7/8/2K5/k7 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const forceOpposition = scoreTwoBishopsWhiteMove(fen, 'Kb3')
  const forceCorner = scoreTwoBishopsWhiteMove(fen, 'Kc3')

  assert.equal(ruleSet.phase(fen), '2/2')
  assert.equal(
    forceOpposition.phaseTwoWaitingMovePenalty,
    forceCorner.phaseTwoWaitingMovePenalty,
  )
  assert.equal(
    forceOpposition.phaseTwoTakeDirectOppositionPenalty,
    forceCorner.phaseTwoTakeDirectOppositionPenalty,
  )
  assert.equal(forceOpposition.phaseTwoForceOpponentOppositionPenalty, 0)
  assert.equal(forceCorner.phaseTwoForceOpponentOppositionPenalty, 0)
  assert.equal(forceOpposition.phaseTwoForceOpponentCornerPenalty, 1)
  assert.equal(forceCorner.phaseTwoForceOpponentCornerPenalty, 1)
  assert.equal(
    forceOpposition.kingBishopScreeningPenalty >
      forceCorner.kingBishopScreeningPenalty,
    true,
  )
})

test('Two Bishops Black captures before seeking the center and bishops', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const cases = [
    {
      fen: '8/3k4/7B/8/8/8/K7/5B2 b - - 0 1',
      moves: ['Kc8', 'Kd8', 'Ke8', 'Ke7', 'Ke6', 'Kd6', 'Kc6', 'Kc7'],
      idealMoves: ['Ke6'],
    },
    {
      fen: '4k3/8/8/8/8/8/8/2B1KB2 b - - 0 1',
      moves: ['Kf8', 'Kf7', 'Ke7', 'Kd7', 'Kd8'],
      idealMoves: ['Ke7', 'Kd7'],
    },
  ] as const

  for (const fixture of cases) {
    assert.deepEqual(ruleSet.blackCandidates(fixture.fen), {
      moves: fixture.moves,
      idealMoves: fixture.idealMoves,
    })
  }

  const captureFen = '8/6K1/2B5/2k5/8/8/8/B7 b - - 1 1'
  const central = scoreTwoBishopsBlackMove(captureFen, 'Kd6')
  const capturesOffCenter = scoreTwoBishopsBlackMove(captureFen, 'Kxc6')
  assert.deepEqual(central, {
    bishopCapturePenalty: 1,
    centerDistance: 1,
    unprotectedBishopDistance: 1,
  })
  assert.deepEqual(capturesOffCenter, {
    bishopCapturePenalty: 0,
    centerDistance: 2,
    unprotectedBishopDistance: 5,
  })
  assert.ok(compareTwoBishopsBlackScores(capturesOffCenter, central) < 0)
  assert.deepEqual(ruleSet.blackCandidates(captureFen).idealMoves, ['Kxc6'])

  const approachFen = '7B/8/8/8/3k4/8/8/K6B b - - 0 1'
  const approachCandidates = ruleSet.blackCandidates(approachFen)
  assert.deepEqual(approachCandidates.moves, ['Kc5', 'Ke3', 'Kd3', 'Kc4'])
  assert.deepEqual(approachCandidates.idealMoves, ['Ke3'])
  assert.equal(
    scoreTwoBishopsBlackMove(approachFen, 'Ke3').centerDistance,
    scoreTwoBishopsBlackMove(approachFen, 'Kd3').centerDistance,
  )
  assert.ok(
    scoreTwoBishopsBlackMove(approachFen, 'Ke3')
      .unprotectedBishopDistance <
      scoreTwoBishopsBlackMove(approachFen, 'Kd3')
        .unprotectedBishopDistance,
  )
})

test('Two Bishops Black returns to the prior board position before scoring', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const previousTurnFen =
    '4k3/8/8/8/8/8/2BB4/4K3 w - - 0 1'
  const currentFen = '3k4/8/8/8/8/8/2BB4/4K3 b - - 7 4'

  assert.deepEqual(
    ruleSet.blackCandidates(currentFen, previousTurnFen).idealMoves,
    ['Ke8'],
  )
})

test('Two Bishops help preserves concrete phase-two guidance', () => {
  const help = getMateRuleSet('two-bishops').help

  assert.equal(
    help.blackIntro,
    'Black uses its own priorities to put up the strongest resistance. Black is not trying to help the mate; it looks for the most stubborn legal reply.',
  )
  assert.deepEqual(help.blackPriorities, [
    'Return to the previous board position when a legal reply can recreate it.',
    "Take a piece if White isn't looking.",
    'Move towards the center.',
    'Move towards an unprotected bishop.',
  ])
  assert.deepEqual(help.notes, [
    "Phase 2 is where Black's king is on an edge and White's king controls at least 2 squares in front of Black's king. Phase 2 also includes positions where White's king is two diagonal squares from Black's king and Black is forced to move along the edge toward White's king.",
    'A phase 2 waiting move keeps the mating net while making Black move.',
  ])
})
