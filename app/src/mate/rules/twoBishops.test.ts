import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess } from '../chess'
import {
  compareTwoBishopsBlackScores,
  getMateRuleSet,
  scoreTwoBishopsBlackMove,
} from './index'

const SOURCE_COMMIT = '70704ecf25d6ee9e5c76a18f49e2a6fce409b728'

const WHITE_RULE_IDS = [
  'mate',
  'no stalemate',
  'bishops safe',
  'stay phase two',
  'waiting move',
  'force opponent to take opposition',
  'take direct opposition',
  'push from controlled edge square',
  'force opponent toward corner',
  'check king',
  'bishops far from corner',
  'avoid king bishop screening',
  'bishops together',
  'king near bishops',
  'force black to edge',
  'bishops closer',
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
    idealMoves: ['Kd4'],
    hint: 'avoid king bishop screening',
    sampledMove: 'Kb3',
    sampledReason: 'avoid king bishop screening',
    idealBlackReplies: { Kd4: ['Kc6'] },
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
    category: 'phase-two corner waiting move',
    fen: '8/8/2B5/2B5/8/8/2K5/k7 w - - 40 21',
    phase: '2/2',
    idealMoves: ['Be4'],
    hint: 'waiting move',
    sampledMove: 'Bf3',
    sampledReason: 'waiting move',
    idealBlackReplies: { Be4: ['Ka2'] },
  },
  {
    category: 'phase-two entry',
    fen: '8/8/8/3BB3/3K4/8/8/3k4 w - - 0 1',
    phase: '1/2',
    idealMoves: ['Kd3'],
    hint: 'stay phase two',
    sampledMove: 'Bc6',
    sampledReason: 'stay phase two',
    idealBlackReplies: { Kd3: ['Ke1'] },
  },
  {
    category: 'phase-two retention and entry',
    fen: '8/1B6/8/6B1/8/5K2/7k/8 w - - 0 1',
    phase: '2/2',
    idealMoves: ['Kf2'],
    hint: 'take direct opposition',
    sampledMove: 'Ba8',
    sampledReason: 'stay phase two',
    idealBlackReplies: { Kf2: ['Kh3'] },
  },
  {
    category: 'direct opposition',
    fen: '8/7k/5K2/8/6B1/6B1/8/8 w - - 64 33',
    phase: '2/2',
    idealMoves: ['Kf7'],
    hint: 'take direct opposition',
    sampledMove: 'Bf4',
    sampledReason: 'stay phase two',
    idealBlackReplies: { Kf7: ['Kh6'] },
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
    hint: 'king near bishops',
    sampledMove: 'Bf6+',
    sampledReason: 'bishops safe',
    idealBlackReplies: { Bg7: ['Ke6'] },
  },
  {
    category: 'stalemate avoidance',
    fen: '8/8/8/7k/4B3/6BK/8/8 w - - 0 1',
    phase: '1/2',
    idealMoves: ['Bf3+'],
    hint: 'king near bishops',
    sampledMove: 'Bf4',
    sampledReason: 'no stalemate',
    idealBlackReplies: { 'Bf3+': ['Kg5'] },
  },
]

test('Two Bishops exposes the literal ordered chess420 priorities', () => {
  const ruleSet = getMateRuleSet('two-bishops')

  assert.deepEqual(
    ruleSet.whiteRuleDescriptions.map(({ id }) => id),
    WHITE_RULE_IDS,
  )
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

test('Two Bishops Black resists the center before approaching bishops', () => {
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
    centerDistance: 1,
    unprotectedBishopDistance: 1,
  })
  assert.deepEqual(capturesOffCenter, {
    centerDistance: 2,
    unprotectedBishopDistance: 0,
  })
  assert.ok(compareTwoBishopsBlackScores(central, capturesOffCenter) < 0)
  assert.deepEqual(ruleSet.blackCandidates(captureFen).idealMoves, ['Kd6'])
})

test('Two Bishops Black returns to the prior full position before scoring', () => {
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

  assert.deepEqual(help.blackPriorities, [
    'Return to the previous full position when a legal reply can recreate it.',
    'Stay away from edges and corners, preferring the center.',
    'Among equally central moves, take an unprotected bishop when possible; otherwise move toward the nearest unprotected bishop.',
  ])
  assert.deepEqual(help.notes, [
    "Phase 2 is where Black's king is on an edge and White's king controls at least 2 squares in front of Black's king. Phase 2 also includes positions where White's king is two diagonal king moves from Black's edge king and Black is forced to move along the edge toward White's king. It applies only on White turns. Squares in front are the squares opposite an edge: edge squares have 3 squares in front of them. Corner front squares are the 3 inward squares, such as a2 and b1 and b2 when Black's king is on a1.",
    "The phase 2 waiting move is not any quiet move. It is a bishop move for a boxed-in king: either the line-pattern waiting move that keeps the wall, or the corner waiting move that lets that bishop cover Black's single escape square after Black moves.",
  ])
})
