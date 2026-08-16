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
  'rule s',
  'rule t',
  'rule v',
  'rule w',
  'king closer',
] as const

test('Two Bishops exposes Rule S through Rule W before king closer', () => {
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
        shortLabel: 'rule s',
        helpText:
          "Applies when the kings are a knight's move apart and a bishop controls the primary squeeze diagonal. Check from the tertiary squeeze diagonal or otherwise take opposition if a bishop can control the secondary squeeze diagonal in one move.",
      },
      {
        shortLabel: 'rule t',
        helpText:
          "When the kings are a knight's move apart, force the Black king to either take opposition or widen the King moat.",
      },
      {
        shortLabel: 'rule v',
        helpText:
          'When the kings are in opposition and a bishop can control the secondary squeeze diagonal in one move, control the primary squeeze diagonal.',
      },
      {
        shortLabel: 'rule w',
        helpText:
          "When the kings are a knight's move apart or two diagonal squares apart, use bishops to control the flank diagonals.",
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
    if (rule.id === 'king closer') {
      assert.equal(rule.applies, undefined)
      assert.equal(typeof rule.compare, 'function')
      assert.equal(rule.subpriorities, undefined)
    } else if (
      rule.id === 'rule s' ||
      rule.id === 'rule t' ||
      rule.id === 'rule v' ||
      rule.id === 'rule w'
    ) {
      assert.equal(typeof rule.applies, 'function')
      assert.equal(typeof rule.compare, 'function')
      assert.equal(rule.subpriorities, undefined)
    } else {
      assert.equal(rule.applies, undefined)
      assert.equal(rule.subpriorities, undefined)
    }
  }
})

test('Two Bishops renders the Rule S through Rule W diagrams', () => {
  const help = getMateRuleSet('two-bishops').help
  assert.deepEqual(help.notes, [])
  assert.equal(help.noteBoards.length, 4)
  assert.deepEqual(help.noteBoards[0], {
    id: 'bishop-rule-s',
    title: 'rule s',
    caption:
      'The tan diagonal is primary, the pink-outlined diagonal is secondary, and the white-outlined diagonal is tertiary.',
    layout: { files: 8, ranks: 8, fileOffset: 0 },
    pieces: [
      { square: 'e7', piece: 'B' },
      { square: 'g4', piece: 'K' },
      { square: 'd3', piece: 'B' },
      { square: 'f2', piece: 'k' },
    ],
    highlights: [
      ...['b8', 'c7', 'd6', 'e5', 'f4', 'g3', 'h2'].map(
        (square) => ({ square, kind: 'wall' }),
      ),
      ...['a8', 'b7', 'c6', 'd5', 'e4', 'f3', 'g2', 'h1'].map(
        (square) => ({ square, kind: 'zone' }),
      ),
      ...['a7', 'b6', 'c5', 'd4', 'e3', 'f2', 'g1'].map(
        (square) => ({ square, kind: 'key' }),
      ),
    ],
    arrows: [{ from: 'e7', to: 'c5' }],
  })
  assert.deepEqual(help.noteBoards[1], {
    id: 'bishop-rule-t',
    title: 'rule t',
    caption: 'The marked f-file is the King moat.',
    layout: { files: 8, ranks: 8, fileOffset: 0 },
    pieces: [
      { square: 'h7', piece: 'B' },
      { square: 'g3', piece: 'k' },
      { square: 'd2', piece: 'B' },
      { square: 'e2', piece: 'K' },
    ],
    highlights: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'].map(
      (square) => ({ square, kind: 'wall' }),
    ),
    arrows: [{ from: 'h7', to: 'f5' }],
  })
  assert.deepEqual(help.noteBoards[2], {
    id: 'bishop-rule-v',
    title: 'rule v',
    caption:
      'The tan diagonals are primary. The pink-outlined diagonals are secondary.',
    layout: { files: 8, ranks: 8, fileOffset: 0 },
    pieces: [
      { square: 'f5', piece: 'B' },
      { square: 'd2', piece: 'B' },
      { square: 'e2', piece: 'K' },
      { square: 'g2', piece: 'k' },
    ],
    highlights: [
      { square: 'f4', kind: 'wall' },
      { square: 'g3', kind: 'wall' },
      { square: 'h2', kind: 'wall' },
      { square: 'g1', kind: 'wall' },
      { square: 'e4', kind: 'zone' },
      { square: 'f3', kind: 'zone' },
      { square: 'g2', kind: 'zone' },
      { square: 'h1', kind: 'zone' },
      { square: 'f1', kind: 'zone' },
      { square: 'h3', kind: 'zone' },
    ],
    arrows: [{ from: 'd2', to: 'f4' }],
  })
  assert.deepEqual(help.noteBoards[3], {
    id: 'bishop-rule-w',
    title: 'rule w',
    caption:
      'The marked diagonals are the flank diagonals. Pink squares show the applicable Black king locations.',
    layout: { files: 8, ranks: 8, fileOffset: 0 },
    pieces: [
      { square: 'e3', piece: 'K' },
      { square: 'c3', piece: 'B' },
      { square: 'c2', piece: 'B' },
    ],
    highlights: [
      ...['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8'].map(
        (square) => ({ square, kind: 'wall' }),
      ),
      ...['b1', 'c2', 'd3', 'e4', 'f5', 'g6', 'h7'].map(
        (square) => ({ square, kind: 'wall' }),
      ),
      { square: 'g4', kind: 'pink' },
      { square: 'g5', kind: 'pink' },
    ],
  })
  assert.equal(
    help.noteBoards[3]?.pieces.some(({ piece }) => piece === 'k'),
    false,
  )
})

test('Rule S checks from the tertiary squeeze diagonal', () => {
  const fen = '8/4B3/8/8/6K1/3B4/5k2/8 w - - 20 11'
  const ruleSet = getMateRuleSet('two-bishops')
  const tertiaryCheck = scoreTwoBishopsWhiteMove(fen, 'Bc5+')
  const otherMove = scoreTwoBishopsWhiteMove(fen, 'Bg5')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(tertiaryCheck.ruleSApplies, true)
  assert.equal(tertiaryCheck.ruleSPenalty, 0)
  assert.equal(otherMove.ruleSApplies, true)
  assert.equal(otherMove.ruleSPenalty, 1)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bc5+'])

  const sourceMove = getChess(fen).move('Bc5+')
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
    assert.deepEqual(
      ruleSet.idealWhiteMoves(transformedFen),
      [transformedMove.san],
      transform.name,
    )
  }

  const phaseTwoFen = '8/8/8/8/8/5K2/7k/3BB3 w - - 0 1'
  assert.equal(ruleSet.phase(phaseTwoFen), '2/2')
  assert.equal(
    scoreTwoBishopsWhiteMove(phaseTwoFen, 'Ke4').ruleSApplies,
    false,
  )
})

test('Rule S otherwise takes opposition when secondary is reachable', () => {
  const fen = '8/2B5/8/1K6/2B5/k7/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const opposition = scoreTwoBishopsWhiteMove(fen, 'Ka5')
  const otherMove = scoreTwoBishopsWhiteMove(fen, 'Kc5')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(opposition.ruleSApplies, true)
  assert.equal(opposition.ruleSPenalty, 0)
  assert.equal(otherMove.ruleSApplies, true)
  assert.equal(otherMove.ruleSPenalty, 1)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Ka5'])
})

test('Rule T forces opposition or a wider king moat', () => {
  const fen = '8/7B/8/8/8/6k1/3BK3/8 w - - 10 6'
  const ruleSet = getMateRuleSet('two-bishops')
  const forced = scoreTwoBishopsWhiteMove(fen, 'Bf5')
  const partial = scoreTwoBishopsWhiteMove(fen, 'Bg8')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(forced.ruleTApplies, true)
  assert.equal(forced.ruleTPenalty, 0)
  assert.equal(forced.ruleTReplyCount, 3)
  assert.equal(partial.ruleTApplies, true)
  assert.equal(partial.ruleTPenalty, 1)
  assert.equal(partial.ruleTReplyCount, 99)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bf5'])

  const sourceMove = getChess(fen).move('Bf5')
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
    assert.equal(score.ruleTApplies, true, transform.name)
    assert.equal(score.ruleTPenalty, 0, transform.name)
    assert.deepEqual(
      ruleSet.idealWhiteMoves(transformedFen),
      [transformedMove.san],
      transform.name,
    )
  }

  const phaseTwoFen = '8/8/8/8/8/5K2/7k/3BB3 w - - 0 1'
  assert.equal(ruleSet.phase(phaseTwoFen), '2/2')
  assert.equal(
    scoreTwoBishopsWhiteMove(phaseTwoFen, 'Ke4').ruleTApplies,
    false,
  )
})

test('Rule T prefers fewer Black replies after forcing the moat choice', () => {
  const fen = '8/4B3/8/8/6K1/3B4/5k2/8 w - - 20 11'
  const ruleSet = getMateRuleSet('two-bishops')
  const fewerReplies = scoreTwoBishopsWhiteMove(fen, 'Bc5+')
  const moreReplies = scoreTwoBishopsWhiteMove(fen, 'Bg5')

  assert.equal(fewerReplies.ruleSApplies, true)
  assert.equal(fewerReplies.ruleSPenalty, 0)
  assert.equal(fewerReplies.ruleTPenalty, 0)
  assert.equal(fewerReplies.ruleTReplyCount, 2)
  assert.equal(moreReplies.ruleTPenalty, 0)
  assert.equal(moreReplies.ruleTReplyCount, 3)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bc5+'])

  const sourceMove = getChess(fen).move('Bc5+')
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
    assert.deepEqual(
      ruleSet.idealWhiteMoves(transformedFen),
      [transformedMove.san],
      transform.name,
    )
  }
})

test('Rule V selects the supplied primary squeeze diagonal', () => {
  const fen = '8/8/8/5B2/8/8/3BK1k1/8 w - - 8 5'
  const ruleSet = getMateRuleSet('two-bishops')
  const primary = scoreTwoBishopsWhiteMove(fen, 'Bf4')
  const kingMove = scoreTwoBishopsWhiteMove(fen, 'Ke3')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(primary.ruleVApplies, true)
  assert.equal(primary.ruleVPenalty, 0)
  assert.equal(kingMove.ruleVApplies, true)
  assert.equal(kingMove.ruleVPenalty, 1)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bf4'])

  const sourceMove = getChess(fen).move('Bf4')
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
    assert.equal(score.ruleVApplies, true, transform.name)
    assert.equal(score.ruleVPenalty, 0, transform.name)
    assert.deepEqual(
      ruleSet.idealWhiteMoves(transformedFen),
      [transformedMove.san],
      transform.name,
    )
  }

  const phaseTwoFen = '8/8/8/8/8/8/5K1k/3BB3 w - - 0 1'
  assert.equal(ruleSet.phase(phaseTwoFen), '2/2')
  assert.equal(
    scoreTwoBishopsWhiteMove(phaseTwoFen, 'Ke3').ruleVApplies,
    false,
  )
})

test('Rule V evaluates the squeeze pair on either side of opposition', () => {
  const fen = '8/8/8/8/1k1K1B2/3B4/8/8 w - - 44 23'
  const ruleSet = getMateRuleSet('two-bishops')
  const safePrimary = scoreTwoBishopsWhiteMove(fen, 'Bc2')
  const unsafePrimary = scoreTwoBishopsWhiteMove(fen, 'Bb5')
  const neitherPrimary = scoreTwoBishopsWhiteMove(fen, 'Be5')

  assert.equal(safePrimary.ruleVApplies, true)
  assert.equal(safePrimary.ruleVPenalty, 0)
  assert.equal(unsafePrimary.ruleVPenalty, 0)
  assert.equal(unsafePrimary.bishopSafetyPenalty, 1)
  assert.equal(neitherPrimary.ruleVPenalty, 1)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bc2'])

  const sourceMove = getChess(fen).move('Bc2')
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
    assert.equal(score.ruleVApplies, true, transform.name)
    assert.equal(score.ruleVPenalty, 0, transform.name)
    assert.deepEqual(
      ruleSet.idealWhiteMoves(transformedFen),
      [transformedMove.san],
      transform.name,
    )
  }
})

test('Rule W completes and preserves the supplied flank diagonals', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const knightFen = '8/8/8/8/6k1/4K3/2BB4/8 w - - 0 1'
  const completed = scoreTwoBishopsWhiteMove(knightFen, 'Bc3')
  const kingMove = scoreTwoBishopsWhiteMove(knightFen, 'Ke4')

  assert.equal(ruleSet.phase(knightFen), '1/2')
  assert.equal(completed.ruleWApplies, true)
  assert.equal(completed.ruleWPenalty, 0)
  assert.equal(kingMove.ruleWPenalty, 1)

  const diagonalFen = '8/8/8/6k1/8/2B1K3/2B5/8 w - - 2 2'
  const preserved = scoreTwoBishopsWhiteMove(diagonalFen, 'Bb2')
  assert.equal(ruleSet.phase(diagonalFen), '1/2')
  assert.equal(preserved.ruleWApplies, true)
  assert.equal(preserved.ruleWPenalty, 0)
  assert.equal(ruleSet.idealWhiteMoves(diagonalFen).includes('Bb2'), true)
  assert.equal(ruleSet.idealWhiteMoves(diagonalFen).includes('Ke4'), false)
})

test('Rule W is rotation/reflection invariant and Phase 1 only', () => {
  const cases = [
    ['8/8/8/8/6k1/4K3/2BB4/8 w - - 0 1', 'Bc3'],
    ['8/8/8/6k1/8/2B1K3/2B5/8 w - - 2 2', 'Bb2'],
  ] as const

  for (const [fen, san] of cases) {
    const sourceMove = getChess(fen).move(san)
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
      assert.ok(transformedMove, `${transform.name}: ${san}`)
      const score = scoreTwoBishopsWhiteMove(
        transformedFen,
        transformedMove.san,
      )
      assert.equal(score.ruleWApplies, true, `${transform.name}: ${san}`)
      assert.equal(
        score.ruleWPenalty,
        0,
        `${transform.name}: ${san}`,
      )
    }
  }

  const phaseTwoFen = '8/3B4/8/8/8/4BK2/8/7k w - - 0 1'
  assert.equal(isTwoBishopsPhaseTwoPosition(phaseTwoFen), true)
  assert.equal(
    scoreTwoBishopsWhiteMove(phaseTwoFen, 'Kf2').ruleWApplies,
    false,
  )
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
