import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  SQUARE_TRANSFORMS,
  allSquares,
  getChess,
  transformFen,
  transformSquare,
} from '../chess'
import {
  areBishopsOnWhiteSideOfOppositionMoat,
  compareTwoBishopsBlackScores,
  getMateRuleSet,
  getProximateBishopWall,
  getTwoBishopsEdgeFlankSquares,
  getTwoBishopsMatingPositionSquares,
  getTwoBishopsPhaseLabel,
  isTwoBishopsCentralPieceSquare,
  isTwoBishopsPhaseTwoPosition,
  isTwoBishopsSquareBehindBlack,
  scoreTwoBishopsBlackMove,
  scoreTwoBishopsWhiteMove,
  twoBishopsRuleSet,
  twoBishopsWhiteRules,
} from './index'

const WHITE_RULE_IDS = [
  'mate',
  'bishops safe',
  'no stalemate',
  'prepare mate',
  'rule g',
  'edge flank',
  'central king',
  'rule uu',
  'onsides',
  'boot scoot n block',
  'rule r',
  'rule s',
  'rule t',
  'rule u',
  'rule v',
  'rule w',
  'rule y',
  'rule z',
  'rule zz',
  'rule z1',
  'death box',
  'megadeth box',
  'rule z2',
  'king stutter',
  'king closer',
  'unscreen bishops',
  'uncluttered bishops',
  'central pieces',
  'bishop distance',
] as const

test('Two Bishops exposes Rule S through bishop distance in order', () => {
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
        shortLabel: 'prepare mate',
        helpText:
          "With the black king in the corner 2 squares and the white king a knight's move from the corner, play mate in 3 or less.",
      },
      {
        shortLabel: 'rule g',
        helpText:
          "Of bishops on Black's side of all king moats, take the one furthest from White and move it furthest from the king moat on White's side and not closer to black in either axis.",
      },
      {
        shortLabel: 'edge flank',
        helpText:
          'When the black king is on the edge, but not in the corner, flank diagonally.',
      },
      {
        shortLabel: 'central king',
        helpText: 'Prefer the king in the middle 32 squares.',
      },
      {
        shortLabel: 'rule uu',
        helpText:
          "If the kings are a knight's move apart, flank if the swap reduces the moat's distance from the edge on Black's side by at least 2.",
      },
      {
        shortLabel: 'onsides',
        helpText:
          "Move a bishop behind Black's king as close as possible to the square behind White's king from Black's king's perspective unless it can be attacked at that destination on the next move.",
      },
      {
        shortLabel: 'boot scoot n block',
        helpText:
          "When the kings are in opposition and a bishop controls the secondary squeeze diagonal on the side closer to the kings, use a bishop boot to control the other primary squeeze diagonal. Then scoot to opposition on the next position. Finally, block the king's escape. (See gif)",
      },
      {
        shortLabel: 'rule r',
        helpText:
          "Applies when the kings are a knight's move apart and a bishop controls the primary squeeze diagonal. If the black king is closer to the side edge than the rear edge, control the secondary squeeze diagonal without placing a bishop offsides.",
      },
      {
        shortLabel: 'rule s',
        helpText:
          "Applies when the kings are a knight's move apart and a bishop controls the primary squeeze diagonal. Check from the tertiary squeeze diagonal to force moat opposition or otherwise take opposition, stepping away from the primary squeeze diagonal.",
      },
      {
        shortLabel: 'rule t',
        helpText:
          "When the kings are a knight's move apart, use a bishop from behind the moat to force the Black king to take moat opposition.",
      },
      {
        shortLabel: 'rule u',
        helpText:
          "When the kings are a knight's move apart, a bishop controls the secondary squeeze diagonal from the white side of the moat, and a bishop can move to control the primary squeeze diagonal from the white side of the moat, take opposition away from the squeeze diagonal.",
      },
      {
        shortLabel: 'rule v',
        helpText:
          'When the kings are in opposition and a bishop can control or x-ray the secondary squeeze diagonal in one move, control the primary squeeze diagonal. If a bishop already controls the primary squeeze diagonal, check from squeeze side.',
      },
      {
        shortLabel: 'rule w',
        helpText:
          "When the kings are a knight's move apart or two diagonal squares apart, use bishops to control the flank diagonals.",
      },
      {
        shortLabel: 'rule y',
        helpText:
          'Use a bishop to prevent Black from attacking the other undefended bishop on their next move, moving along a diagonal that separates the kings, unless Black can attack it on the next move.',
      },
      {
        shortLabel: 'rule z',
        helpText:
          "If Black's king is in a corner, put White's king a knight's move away. If Black is one edge-square from that corner, use a bishop to control the next edge-square away from the corner.",
      },
      {
        shortLabel: 'rule zz',
        helpText: 'Keep bishops not on a shortest path between the kings.',
      },
      {
        shortLabel: 'rule z1',
        helpText:
          "When the kings are a knight's move apart and bishops control the flank diagonals, use a bishop to control the primary squeeze diagonal.",
      },
      {
        shortLabel: 'death box',
        helpText:
          "When possible, place a bishop in opposition with a king on the edge, next to a bishop that is a knight's move from the Black king, without either piece on the edge. Prefer keeping the death box.",
      },
      {
        shortLabel: 'megadeth box',
        helpText:
          'With the king on the edge and a bishop controlling the inward adjacent square, place the other bishop in middle-16-squares opposition to the king, adjacent to the first bishop. Prefer keeping the megadeth box.',
      },
      {
        shortLabel: 'rule z2',
        helpText:
          "When the kings are 2 diagonal squares apart and bishops control the 2 diagonals parallel and adjacent to the kings' diagonal, maintain those diagonals and don't move the king.",
      },
      {
        shortLabel: 'king stutter',
        helpText: 'Do a king stutter step.',
      },
      {
        shortLabel: 'king closer',
        helpText:
          "Bring White's king closer to Black's king, preferring proximity to the the middle 16 squares.",
      },
      {
        shortLabel: 'unscreen bishops',
        helpText: "Keep bishops off White's king's diagonal.",
      },
      {
        shortLabel: 'uncluttered bishops',
        helpText:
          "If Black's king is in the corner, prefer bishops off of squares a knight's move from the corner.",
      },
      {
        shortLabel: 'central pieces',
        helpText: "Prefer White's pieces in the middle 32 squares.",
      },
      {
        shortLabel: 'bishop distance',
        helpText: "Prefer bishops onsides farther from Black's king.",
      },
    ],
  )
  assert.deepEqual(
    getMateRuleSet('two-bishops').whiteRuleDescriptions.map(({ id }) => id),
    WHITE_RULE_IDS,
  )
  assert.equal(twoBishopsRuleSet.whiteMoveOverride, undefined)
  for (const rule of twoBishopsWhiteRules) {
    if (
      rule.id === 'king closer' ||
      rule.id === 'central king' ||
      rule.id === 'central pieces' ||
      rule.id === 'unscreen bishops' ||
      rule.id === 'bishop distance'
    ) {
      assert.equal(rule.applies, undefined)
      assert.equal(typeof rule.compare, 'function')
      assert.equal(rule.subpriorities, undefined)
    } else if (
      rule.id === 'rule r' ||
      rule.id === 'rule s' ||
      rule.id === 'prepare mate' ||
      rule.id === 'rule g' ||
      rule.id === 'edge flank' ||
      rule.id === 'onsides' ||
      rule.id === 'boot scoot n block' ||
      rule.id === 'rule t' ||
      rule.id === 'rule uu' ||
      rule.id === 'rule u' ||
      rule.id === 'rule v' ||
      rule.id === 'rule w' ||
      rule.id === 'rule y' ||
      rule.id === 'rule z' ||
      rule.id === 'rule z1' ||
      rule.id === 'rule z2' ||
      rule.id === 'king stutter' ||
      rule.id === 'uncluttered bishops' ||
      rule.id === 'death box' ||
      rule.id === 'megadeth box'
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

test('Rule Z puts White a knight move from a cornered Black king', () => {
  const fen = '8/2B5/8/8/8/1B3K2/8/7k w - - 2 2'
  const sourceMove = getChess(fen).move('Kg3')
  const ruleSet = getMateRuleSet('two-bishops')

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
    assert.equal(
      ruleSet.currentWhiteHint(transformedFen)?.id,
      'rule z',
      transform.name,
    )
  }
})

test('Rule Z controls the next edge square after Black leaves the corner', () => {
  const fen = '8/8/8/8/8/1B6/5K1k/4B3 w - - 2 2'
  const sourceMove = getChess(fen).move('Be6')
  const ruleSet = getMateRuleSet('two-bishops')

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
    assert.equal(
      ruleSet.currentWhiteHint(transformedFen)?.id,
      'rule z',
      transform.name,
    )
  }
})

test('Rule ZZ keeps bishops off every resulting shortest king path', () => {
  const fen = '8/7B/8/8/8/2B1k3/8/K7 w - - 0 1'
  const moveOffPath = scoreTwoBishopsWhiteMove(fen, 'Bb4')
  const moveOtherBishop = scoreTwoBishopsWhiteMove(fen, 'Bg8')
  const moveKing = scoreTwoBishopsWhiteMove(fen, 'Kb1')
  const postMoveKing = scoreTwoBishopsWhiteMove(
    '1B2B3/3K3k/8/8/8/8/8/8 w - - 0 1',
    'Ke7',
  )

  assert.equal(moveOffPath.ruleZZPenalty, 0)
  assert.equal(moveOtherBishop.ruleZZPenalty, 1)
  assert.equal(moveKing.ruleZZPenalty, 0)
  assert.equal(postMoveKing.ruleZZPenalty, 0)
})

test('Death Box completes the adjacent opposition and knight pattern', () => {
  const fen = '8/8/3B4/5B2/7k/8/4K3/8 w - - 0 1'
  const sourceMove = getChess(fen).move('Bf4')
  const ruleSet = getMateRuleSet('two-bishops')

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
    assert.equal(
      ruleSet.currentWhiteHint(transformedFen)?.id,
      'death box',
      transform.name,
    )
  }
})

test('Death Box applies when one bishop is outside the middle 16 squares', () => {
  const fen = '8/2BB4/k7/8/3K4/8/8/8 w - - 0 1'
  const score = scoreTwoBishopsWhiteMove(fen, 'Bc6')

  assert.equal(score.deathBoxApplies, true)
  assert.equal(score.deathBoxPenalty, 0)
})

test("Death Box rejects an opposition bishop a knight's move from the corner", () => {
  const fen = '2B5/k7/2K5/8/8/6B1/8/8 w - - 2 2'
  const score = scoreTwoBishopsWhiteMove(fen, 'Bc7')

  assert.equal(score.deathBoxApplies, false)
})

test('Death Box requires both bishops to finish off the edge', () => {
  const fen = '4k3/6B1/8/2K5/8/1B6/8/8 w - - 0 1'
  const score = scoreTwoBishopsWhiteMove(fen, 'Bg8')

  assert.equal(score.deathBoxApplies, false)
})

test('Death Box prefers preserving an established death box', () => {
  const fen = '8/8/5B1k/5B2/5K2/8/8/8 w - - 0 1'
  const preserves = scoreTwoBishopsWhiteMove(fen, 'Ke3')
  const breaks = scoreTwoBishopsWhiteMove(fen, 'Bc2')

  assert.equal(preserves.deathBoxApplies, true)
  assert.equal(preserves.deathBoxPenalty, 0)
  assert.equal(breaks.deathBoxApplies, true)
  assert.equal(breaks.deathBoxPenalty, 1)
  assert.deepEqual(getMateRuleSet('two-bishops').idealWhiteMoves(fen), [
    'Ke5',
  ])
})

test('Megadeth Box completes inward control and bishop opposition', () => {
  const fen = '8/3K4/8/k7/2B5/4B3/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const sourceMove = getChess(fen).move('Bc5')

  assert.ok(sourceMove)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bc5'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bc5').megadethBoxApplies, true)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bc5').megadethBoxPenalty, 0)

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
    assert.equal(score.megadethBoxApplies, true, transform.name)
    assert.equal(score.megadethBoxPenalty, 0, transform.name)
    assert.deepEqual(
      ruleSet.idealWhiteMoves(transformedFen),
      [transformedMove.san],
      transform.name,
    )
  }
})

test('Megadeth Box rejects opposition outside the middle 16', () => {
  const fen = '7K/8/8/8/4B3/2B5/k7/8 w - - 0 1'
  const score = scoreTwoBishopsWhiteMove(fen, 'Bc2')

  assert.equal(score.megadethBoxApplies, false)
  assert.equal(score.megadethBoxPenalty, 1)
  assert.equal(
    getMateRuleSet('two-bishops').idealWhiteMoves(fen).includes('Bc2'),
    false,
  )
})

test('Megadeth Box preserves bishop adjacency', () => {
  const fen = '8/8/8/5B2/4KB1k/8/8/8 w - - 8 5'
  const breaksBox = scoreTwoBishopsWhiteMove(fen, 'Bd7')
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(breaksBox.megadethBoxApplies, true)
  assert.equal(breaksBox.megadethBoxPenalty, 1)
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Bd7'), false)
  for (const idealMove of ruleSet.idealWhiteMoves(fen)) {
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, idealMove).megadethBoxPenalty,
      0,
      idealMove,
    )
  }
})

test("Uncluttered Bishops uses the corner occupied by Black's king", () => {
  const fen = 'k1B5/2B5/2K5/8/8/8/8/8 w - - 0 1'
  const clearsCornerKnightSquare = scoreTwoBishopsWhiteMove(fen, 'Bd6')
  const leavesCornerKnightSquare = scoreTwoBishopsWhiteMove(fen, 'Bg4')

  assert.equal(clearsCornerKnightSquare.unclutteredBishopsApplies, true)
  assert.equal(clearsCornerKnightSquare.unclutteredBishopsPenalty, 0)
  assert.equal(leavesCornerKnightSquare.unclutteredBishopsPenalty, 1)
})

test('Rule R controls the reflected secondary when the side edge is closer', () => {
  const fen = '1B1K4/8/2B1k3/8/8/8/8/8 w - - 0 1'
  const preferred = scoreTwoBishopsWhiteMove(fen, 'Ba8')
  const offsides = scoreTwoBishopsWhiteMove(fen, 'Be5')

  assert.equal(getMateRuleSet('two-bishops').phase(fen), '1/2')
  assert.equal(preferred.ruleRApplies, true)
  assert.equal(preferred.ruleRPenalty, 0)
  assert.equal(offsides.ruleRApplies, true)
  assert.equal(offsides.ruleRPenalty, 1)
  const sourceMove = getChess(fen).move('Ba8')
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
    assert.equal(score.ruleRApplies, true, transform.name)
    assert.equal(score.ruleRPenalty, 0, transform.name)
  }
})

test('Rule R does not apply unless the side edge is strictly closer', () => {
  const fen = '8/8/1B6/3B4/4K3/2k5/8/8 w - - 0 1'
  const legalMove = getChess(fen).moves()[0]

  assert.ok(legalMove)
  assert.equal(
    scoreTwoBishopsWhiteMove(fen, legalMove).ruleRApplies,
    false,
  )
})

test('Rule R rejects a reflected secondary bishop placed offsides', () => {
  const fen = '8/B2K3B/8/4k3/8/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const offsides = scoreTwoBishopsWhiteMove(fen, 'Be3')

  assert.equal(offsides.ruleRApplies, true)
  assert.equal(offsides.ruleRPenalty, 1)
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Be3'), false)
})

test('Rule UU swaps the moat axis when that brings the Black-side edge closer', () => {
  const fen = '8/8/8/8/1k6/4BB2/2K5/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const preferred = scoreTwoBishopsWhiteMove(fen, 'Kd3')
  const noSwap = scoreTwoBishopsWhiteMove(fen, 'Kb2')

  assert.equal(preferred.ruleUUApplies, true)
  assert.equal(preferred.ruleUUPenalty, 0)
  assert.equal(noSwap.ruleUUPenalty, 1)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kd3'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'rule uu')
})

test('Rule UU outranks onsides in the supplied moat-swap position', () => {
  const fen = '8/8/2K5/8/1k6/4B3/4B3/8 w - - 6 4'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kd5'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'rule uu')
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kd5').ruleUUPenalty, 0)
})

test('prepare mate plays mate within three from the corner L', () => {
  const fen = '5B2/8/8/8/8/6KB/8/6k1 w - - 2 2'
  const sourceMove = getChess(fen).move('Bc5+')
  const ruleSet = getMateRuleSet('two-bishops')

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
    assert.equal(score.prepareMateApplies, true, transform.name)
    assert.equal(score.prepareMatePenalty, 0, transform.name)
    assert.deepEqual(
      ruleSet.idealWhiteMoves(transformedFen),
      [transformedMove.san],
      transform.name,
    )
    assert.equal(
      ruleSet.currentWhiteHint(transformedFen)?.id,
      'prepare mate',
      transform.name,
    )
  }
})

test('prepare mate continues the recognized mate-in-two line', () => {
  const fen = '8/8/8/6B1/6B1/8/7k/5K2 w - - 2 2'
  const sourceMove = getChess(fen).move('Bf4+')
  const ruleSet = getMateRuleSet('two-bishops')

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
    assert.equal(
      ruleSet.currentWhiteHint(transformedFen)?.id,
      'prepare mate',
      transform.name,
    )
  }
})

test('prepare mate is inactive outside the corner L', () => {
  const fen = 'B7/1B6/8/8/8/6K1/8/5k2 w - - 0 1'

  assert.equal(
    scoreTwoBishopsWhiteMove(fen, 'Kf3').prepareMateApplies,
    false,
  )
})

test('prepare mate follows the fixed setup, check, and mate maneuver', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  assert.ok(ruleSet.analyzeWhitePosition)
  const analyzeWhitePosition = ruleSet.analyzeWhitePosition
  const stages = [
    {
      fen: '8/8/8/8/8/2B3K1/4B3/7k w - - 6 4',
      move: 'Bf6',
      reason: 'prepare mate',
    },
    {
      fen: '8/8/5B2/8/8/6K1/4B3/6k1 w - - 8 5',
      move: 'Bd4+',
      reason: 'prepare mate',
    },
    {
      fen: '8/8/8/8/3B4/6K1/4B3/7k w - - 10 6',
      move: 'Bf3#',
      reason: 'mate',
    },
  ] as const

  for (const stage of stages) {
    const analysis = analyzeWhitePosition(stage.fen)
    assert.equal(analysis.idealWhiteMoves.includes(stage.move), true)
    assert.equal(analysis.currentWhiteHint?.id, stage.reason)
  }
})

test('Rule G moves the Black-side bishop farthest from White as far across the moat as possible', () => {
  const fen = '8/8/8/6BB/8/4K1k1/8/8 w - - 0 1'
  const preferred = scoreTwoBishopsWhiteMove(fen, 'Bd1')
  const nearerDestination = scoreTwoBishopsWhiteMove(fen, 'Be2')
  const nearerBishop = scoreTwoBishopsWhiteMove(fen, 'Bf6')

  assert.equal(preferred.ruleGApplies, true)
  assert.equal(preferred.ruleGPenalty, 0)
  assert.equal(nearerDestination.ruleGPenalty, 1)
  assert.equal(nearerBishop.ruleGPenalty, 1)
})

test('Rule G is inactive without recognized king-moat geometry', () => {
  const fen = '7k/8/8/8/2K5/3BB3/8/8 w - - 0 1'
  const san = getChess(fen).moves()[0]!
  assert.equal(scoreTwoBishopsWhiteMove(fen, san).ruleGApplies, false)
})

test('Rule G requires a bishop to be Black-side of every active moat', () => {
  const fen = '8/8/8/2BK4/8/5k2/8/1B6 w - - 2 2'
  const score = scoreTwoBishopsWhiteMove(fen, 'Bh7')

  assert.equal(score.ruleGApplies, false)
  assert.equal(score.ruleGPenalty, 1)
})

test("Rule G rejects crossings that move closer to Black's king on either axis", () => {
  const fen = 'B7/8/3B4/8/8/4k3/8/3K4 w - - 2 2'
  const score = scoreTwoBishopsWhiteMove(fen, 'Bh1')

  assert.equal(score.ruleGApplies, false)
  assert.equal(score.ruleGPenalty, 1)
})

test('king stutter uniquely selects Ke4 in the supplied pattern', () => {
  const fen = '8/8/5B2/4KB1k/8/8/8/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Ke4'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'king stutter')
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Ke4').kingStutterPenalty, 0)
})

test('king stutter supports rotations, reflections, and translations', () => {
  const fen = '8/8/5B2/4KB1k/8/8/8/8 w - - 2 2'
  const sourceMove = getChess(fen).move('Ke4')
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
    assert.equal(score.kingStutterApplies, true, transform.name)
    assert.equal(score.kingStutterPenalty, 0, transform.name)
  }

  const translatedFen = '8/8/8/5B2/4KB1k/8/8/8 w - - 0 1'
  assert.equal(
    scoreTwoBishopsWhiteMove(translatedFen, 'Ke3').kingStutterPenalty,
    0,
  )
})

test('king stutter is inactive when Black is not on an edge', () => {
  const fen = '8/8/4B3/3KB1k1/8/8/8/8 w - - 0 1'

  assert.equal(
    scoreTwoBishopsWhiteMove(fen, 'Kd4').kingStutterApplies,
    false,
  )
})

test('unique immediate mate keeps incorrect-move explanations at mate', () => {
  const fen = '8/8/8/8/3B4/6K1/4B3/7k w - - 10 6'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.ok(ruleSet.analyzeWhitePosition)
  const analysis = ruleSet.analyzeWhitePosition(fen)
  assert.ok(analysis.explainWhiteMove)

  assert.deepEqual(analysis.idealWhiteMoves, ['Bf3#'])
  assert.equal(analysis.currentWhiteHint?.id, 'mate')
  assert.equal(analysis.explainWhiteMove('Bc3')?.id, 'mate')
})

test('central pieces uses the middle six-by-six without its corners', () => {
  const centralSquares = allSquares().filter(isTwoBishopsCentralPieceSquare)

  assert.equal(centralSquares.length, 32)
  for (const square of ['b2', 'b7', 'g2', 'g7'] as const) {
    assert.equal(isTwoBishopsCentralPieceSquare(square), false, square)
  }
  for (const square of ['b3', 'c2', 'f7', 'g6'] as const) {
    assert.equal(isTwoBishopsCentralPieceSquare(square), true, square)
  }
  for (const square of ['a4', 'h4', 'd1', 'd8'] as const) {
    assert.equal(isTwoBishopsCentralPieceSquare(square), false, square)
  }
  for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(
      isTwoBishopsCentralPieceSquare(transformSquare('b3', transform)),
      true,
      transform.name,
    )
  }
})

test('central king prefers only the resulting king in the middle 32', () => {
  const fen = '7k/8/8/8/K7/3B4/8/4B3 w - - 0 1'
  const central = scoreTwoBishopsWhiteMove(fen, 'Kb4')
  const outside = scoreTwoBishopsWhiteMove(fen, 'Ka3')
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'central king')

  assert.ok(rule?.compare)
  assert.equal(central.centralKingPenalty, 0)
  assert.equal(outside.centralKingPenalty, 1)
  assert.ok(rule.compare(central, outside) < 0)
})

test('central pieces scores the resulting king and both bishops equally in both phases', () => {
  const phaseOneFen = '7k/8/8/8/K7/3B4/8/4B3 w - - 0 1'
  const kingMove = scoreTwoBishopsWhiteMove(phaseOneFen, 'Kb4')
  const centralBishopMove = scoreTwoBishopsWhiteMove(phaseOneFen, 'Bd2')
  const noncentralMove = scoreTwoBishopsWhiteMove(phaseOneFen, 'Be2')

  assert.equal(getMateRuleSet('two-bishops').phase(phaseOneFen), '1/2')
  assert.equal(kingMove.centralPiecesPenalty, 1)
  assert.equal(centralBishopMove.centralPiecesPenalty, 1)
  assert.equal(noncentralMove.centralPiecesPenalty, 2)

  const phaseTwoFen = '8/8/8/2B5/k1B5/8/1K6/8 w - - 0 1'
  const phaseTwoKingMove = scoreTwoBishopsWhiteMove(phaseTwoFen, 'Kc3')

  assert.equal(getMateRuleSet('two-bishops').phase(phaseTwoFen), '2/2')
  assert.equal(phaseTwoKingMove.centralPiecesPenalty, 0)
})

test('edge flank derives translated, reflected, and rotated targets', () => {
  assert.deepEqual(getTwoBishopsEdgeFlankSquares('h6'), ['f5', 'f7'])
  for (const [edgeSquare, expected] of [
    ['h2', ['f1', 'f3']],
    ['h3', ['f2', 'f4']],
    ['h4', ['f3', 'f5']],
    ['h5', ['f4', 'f6']],
    ['h6', ['f5', 'f7']],
    ['h7', ['f6', 'f8']],
  ] as const) {
    assert.deepEqual(
      getTwoBishopsEdgeFlankSquares(edgeSquare),
      expected,
      edgeSquare,
    )
  }
  assert.deepEqual(
    [...getTwoBishopsEdgeFlankSquares('h8')].sort(),
    ['f7', 'g6'],
  )

  const sourceTargets = getTwoBishopsEdgeFlankSquares('h6')
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedBlackKing = transformSquare('h6', transform)
    assert.deepEqual(
      [...getTwoBishopsEdgeFlankSquares(transformedBlackKing)].sort(),
      sourceTargets.map((square) => transformSquare(square, transform)).sort(),
      transform.name,
    )
  }
})

test('edge flank is inactive when Black is in a corner', () => {
  const fen = '8/8/8/8/8/1B3K2/8/4B2k w - - 0 1'

  assert.equal(
    scoreTwoBishopsWhiteMove(fen, 'Kf2').edgeFlankApplies,
    false,
  )
})

test('edge flank uniquely selects the supplied Phase 1 move in every symmetry', () => {
  const fen = '8/8/3BB2k/8/6K1/8/8/8 w - - 20 11'
  const ruleSet = getMateRuleSet('two-bishops')
  const sourceMove = getChess(fen).move('Kf5')

  assert.ok(sourceMove)
  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kf5').edgeFlankPenalty, 0)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kf5'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge flank')

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
    assert.equal(score.edgeFlankApplies, true, transform.name)
    assert.equal(score.edgeFlankPenalty, 0, transform.name)
  }
})

test('edge flank scores the resulting king square in Phase 2', () => {
  const fen = '8/8/8/2B5/k1B5/8/1K6/8 w - - 0 1'
  const score = scoreTwoBishopsWhiteMove(fen, 'Kc3')

  assert.equal(getMateRuleSet('two-bishops').phase(fen), '2/2')
  assert.equal(score.edgeFlankApplies, true)
  assert.equal(score.edgeFlankPenalty, 0)
})

test('edge flank rejects a lateral king move onto a flank square', () => {
  const fen = '8/8/8/8/4B3/3KB3/8/3k4 w - - 50 26'
  const ruleSet = getMateRuleSet('two-bishops')
  const sourceMove = getChess(fen).move('Kc3')

  assert.ok(sourceMove)
  assert.equal(ruleSet.phase(fen), '2/2')
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kc3').edgeFlankPenalty, 1)
  assert.notEqual(ruleSet.currentWhiteHint(fen)?.id, 'edge flank')

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
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, transformedMove.san)
        .edgeFlankPenalty,
      1,
      transform.name,
    )
  }
})

test('edge flank requires knight-distance kings before and after White moves', () => {
  const ineligibleFen = '8/8/1B6/8/6K1/3B4/8/4k3 w - - 4 3'
  const ruleSet = getMateRuleSet('two-bishops')
  const ineligibleMoves = getChess(ineligibleFen).moves()

  assert.ok(ineligibleMoves.length > 0)
  for (const move of ineligibleMoves) {
    assert.equal(
      scoreTwoBishopsWhiteMove(ineligibleFen, move).edgeFlankApplies,
      false,
      move,
    )
  }
  assert.notEqual(ruleSet.currentWhiteHint(ineligibleFen)?.id, 'edge flank')

  const eligibleFen = '8/8/3BB2k/8/6K1/8/8/8 w - - 20 11'
  const eligible = scoreTwoBishopsWhiteMove(eligibleFen, 'Kf5')
  assert.equal(eligible.edgeFlankApplies, true)
  assert.equal(eligible.edgeFlankPenalty, 0)
})

test('onsides uses the shorter king differential behind Black', () => {
  assert.equal(isTwoBishopsSquareBehindBlack('g4', 'd2', 'e4'), true)
  assert.equal(isTwoBishopsSquareBehindBlack('b6', 'd2', 'e4'), false)
  assert.equal(isTwoBishopsSquareBehindBlack('g5', 'd2', 'e4'), false)
})

test('onsides rejects a destination Black can attack on the next move', () => {
  const fen = '8/B7/4K3/8/5k2/8/2B5/8 w - - 14 8'
  const attacked = scoreTwoBishopsWhiteMove(fen, 'Bg6')
  const safe = scoreTwoBishopsWhiteMove(fen, 'Bh7')
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(attacked.onsidesApplies, true)
  assert.equal(attacked.onsidesPenalty, 1)
  assert.equal(safe.onsidesPenalty, 0)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bh7'])
})

test('onsides gives equal king differentials no behind-Black exception', () => {
  const fen = '8/8/8/1B1k4/8/5K2/8/6B1 w - - 4 3'

  assert.equal(isTwoBishopsSquareBehindBlack('d7', 'f3', 'd5'), false)
  assert.equal(isTwoBishopsSquareBehindBlack('c6', 'f3', 'd5'), false)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bd7').onsidesPenalty, 1)
  assert.ok(
    !getMateRuleSet('two-bishops').idealWhiteMoves(fen).includes('Bd7'),
  )
})

test('onsides ranks equal-differential moat crossings toward the square beyond White', () => {
  const fen = '3B4/8/8/3k4/8/1K6/8/1B6 w - - 10 6'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Ba5').onsidesPenalty, 0)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bh4').onsidesPenalty, 1)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Ba5'])
})

test('onsides rejects a bishop beyond Black on both equal-difference axes', () => {
  const fen = '8/2B2B2/5k2/8/3K4/8/8/8 w - - 14 8'

  assert.equal(isTwoBishopsSquareBehindBlack('g8', 'd4', 'f6'), false)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bg8').onsidesPenalty, 1)
  assert.ok(
    !getMateRuleSet('two-bishops').idealWhiteMoves(fen).includes('Bg8'),
  )
})

test('onsides treats only rank one as behind Black in vertical geometry', () => {
  assert.equal(isTwoBishopsSquareBehindBlack('f1', 'd5', 'd2'), true)
  assert.equal(isTwoBishopsSquareBehindBlack('e2', 'd5', 'd2'), false)
})

test('onsides is inactive when both bishops start on White side of the moat', () => {
  const fen = '8/3B4/8/8/7k/5K2/3B4/8 w - - 4 3'
  const legalMove = getChess(fen).moves()[0]

  assert.ok(legalMove)
  assert.equal(scoreTwoBishopsWhiteMove(fen, legalMove).onsidesApplies, false)
})

test('onsides can cross an aligned-kings moat without landing behind Black', () => {
  const fen = '8/8/k2K4/8/B7/8/3B4/8 w - - 0 1'
  const crossesMoat = scoreTwoBishopsWhiteMove(fen, 'Be8')
  const staysOffside = scoreTwoBishopsWhiteMove(fen, 'Bb4')

  assert.equal(isTwoBishopsSquareBehindBlack('e8', 'd6', 'a6'), false)
  assert.equal(crossesMoat.onsidesApplies, true)
  assert.equal(crossesMoat.onsidesPenalty, 0)
  assert.equal(staysOffside.onsidesPenalty, 1)
})

test('onsides rejects a destination that remains on Black side of the moat', () => {
  const fen = '8/8/8/1K2k3/8/4B3/8/1B6 w - - 20 11'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf2').onsidesPenalty, 1)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kc5').onsidesPenalty, 0)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kc5'])
})

test('onsides treats a bishop level with Black as already onsides', () => {
  const fen = '8/1k1K4/8/8/1BB5/8/8/8 w - - 0 1'
  const level = scoreTwoBishopsWhiteMove(fen, 'Be7')
  const newlyOffsides = scoreTwoBishopsWhiteMove(fen, 'Ba5')

  assert.equal(level.onsidesPenalty, 0)
  assert.equal(newlyOffsides.onsidesPenalty, 1)
  assert.notEqual(
    getMateRuleSet('two-bishops').explainWhiteMove(fen, 'Be7')?.id,
    'onsides',
  )
})

test('onsides is inactive when a corner leaves no behind-Black region', () => {
  const fen = '7k/8/8/8/8/5K2/3BB3/8 w - - 0 1'
  const score = scoreTwoBishopsWhiteMove(fen, 'Be1')

  assert.equal(score.onsidesApplies, false)
})

test('edge Black king with no behind region treats both bishops as onsides', () => {
  const fen = '8/4K2k/8/6BB/8/8/8/8 w - - 10 6'
  const score = scoreTwoBishopsWhiteMove(fen, 'Bd2')

  assert.equal(score.onsidesApplies, false)
  assert.equal(score.bishopDistance, Math.sqrt(41) + 2)
})

test('boot scoot n block validates every White move in the GIF', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const positions = [
    {
      fen: '8/8/4B3/8/3K4/B7/3k4/8 w - - 14 8',
      move: 'Bg4',
      reason: 'boot scoot n block',
    },
    {
      fen: '8/8/8/8/3K2B1/B7/2k5/8 w - - 16 9',
      move: 'Kc4',
      reason: 'boot scoot n block',
    },
    {
      fen: '8/8/8/8/2K3B1/B7/3k4/8 w - - 18 10',
      move: 'Bc5',
      reason: 'boot scoot n block',
    },
  ] as const

  for (const { fen, move, reason } of positions) {
    assert.equal(ruleSet.phase(fen), '1/2')
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [move])
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, reason)
  }

  const boot = scoreTwoBishopsWhiteMove(positions[0].fen, 'Bg4')
  const blockedWiderBoot = scoreTwoBishopsWhiteMove(
    positions[0].fen,
    'Bc4',
  )
  assert.equal(boot.bootNScootApplies, true)
  assert.equal(boot.bootNScootPenalty, 0)
  assert.equal(boot.bootNScootReplyCount, 2)
  assert.equal(blockedWiderBoot.bootNScootPenalty, 1)

  const scoot = scoreTwoBishopsWhiteMove(positions[1].fen, 'Kc4')
  assert.equal(scoot.bootNScootApplies, true)
  assert.equal(scoot.bootNScootPenalty, 0)
  assert.equal(
    scoreTwoBishopsWhiteMove(positions[2].fen, 'Bc5').bootNScootApplies,
    true,
  )
})

test('boot scoot n block controls the other primary squeeze diagonal', () => {
  const fen = '4B3/2B5/8/3K1k2/8/8/8/8 w - - 10 6'
  const score = scoreTwoBishopsWhiteMove(fen, 'Be5')

  assert.equal(score.bootNScootPenalty, 1)
  assert.ok(!getMateRuleSet('two-bishops').idealWhiteMoves(fen).includes('Be5'))
})

test("boot scoot n block includes the moat in White's side", () => {
  assert.equal(
    areBishopsOnWhiteSideOfOppositionMoat(
      'd4',
      'd2',
      ['e6', 'a3'],
    ),
    true,
  )
  assert.equal(
    areBishopsOnWhiteSideOfOppositionMoat(
      'd4',
      'd2',
      ['e6', 'b2'],
    ),
    false,
  )
})

test('boot scoot n block validates the Bh5 waiting-bishop line', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const positions = [
    {
      fen: '8/5B2/8/8/3K4/B7/3k4/8 w - - 0 1',
      move: 'Bh5',
    },
    {
      fen: '8/8/8/7B/3K4/B7/2k5/8 w - - 2 2',
      move: 'Kc4',
    },
    {
      fen: '8/8/8/7B/2K5/B7/3k4/8 w - - 4 3',
      move: 'Bc5',
    },
  ] as const

  for (const { fen, move } of positions) {
    assert.equal(ruleSet.phase(fen), '1/2')
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [move])
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'boot scoot n block')
  }
})

test('boot scoot n block requires the nearer-side secondary diagonal', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const formerA5Fen = '8/8/8/B7/5K2/7B/4k3/8 w - - 0 1'
  const wrongSideBootFen =
    '8/8/8/4B3/4K3/1B6/4k3/8 w - - 0 1'
  const formerA5Scoot = scoreTwoBishopsWhiteMove(formerA5Fen, 'Ke4')
  const wrongSideBoot = scoreTwoBishopsWhiteMove(
    wrongSideBootFen,
    'Bg3',
  )

  assert.equal(formerA5Scoot.bootNScootPenalty, 1)
  assert.equal(ruleSet.idealWhiteMoves(formerA5Fen).includes('Ke4'), false)
  assert.equal(wrongSideBoot.bootNScootApplies, false)
  assert.equal(ruleSet.idealWhiteMoves(wrongSideBootFen).includes('Bg3'), false)
  assert.notEqual(
    ruleSet.currentWhiteHint(wrongSideBootFen)?.id,
    'boot scoot n block',
  )
})

test('boot scoot n block requires a legal scoot after a non-widening reply', () => {
  const fen = '8/8/8/8/4K3/7B/4k2B/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  const blockedScoot = scoreTwoBishopsWhiteMove(fen, 'Bf4')

  assert.equal(blockedScoot.bootNScootApplies, false)
  assert.equal(blockedScoot.bootNScootPenalty, 1)
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Bf4'), false)
})

test('boot scoot n block requires a final block after a non-widening reply', () => {
  const fen = '8/8/8/8/3K4/6BB/4k3/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  const cyclicScoot = scoreTwoBishopsWhiteMove(fen, 'Ke4')

  assert.equal(cyclicScoot.bootNScootApplies, true)
  assert.equal(cyclicScoot.bootNScootPenalty, 1)
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Ke4'), false)
})

test('boot scoot n block prefers the final block over another scoot', () => {
  const fen = '8/8/3K4/8/4k3/8/3BB3/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  const finalBlock = scoreTwoBishopsWhiteMove(fen, 'Bg4')
  const cyclicScoot = scoreTwoBishopsWhiteMove(fen, 'Ke6')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(finalBlock.bootNScootApplies, true)
  assert.equal(finalBlock.bootNScootPenalty, 0)
  assert.equal(cyclicScoot.bootNScootPenalty, 1)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bg4'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'boot scoot n block')
})

test('boot scoot n block is translated and symmetric', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const sourceFen = '8/8/4B3/8/3K4/B7/3k4/8 w - - 14 8'
  const sourceMove = getChess(sourceFen).move('Bg4')
  const translatedFen = '8/4B3/8/3K4/B7/3k4/8/8 w - - 14 8'

  assert.ok(sourceMove)
  assert.deepEqual(ruleSet.idealWhiteMoves(translatedFen), ['Bg5'])
  assert.equal(
    ruleSet.currentWhiteHint(translatedFen)?.id,
    'boot scoot n block',
  )

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(sourceFen, transform)).fen()
    const transformedMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    assert.ok(transformedMove, transform.name)
    assert.equal(
      ruleSet.currentWhiteHint(transformedFen)?.id,
      'boot scoot n block',
      transform.name,
    )
  }
})

test('boot scoot n block rejects a Phase 2 boot off the other primary', () => {
  const fen = '3K1k1B/8/8/8/8/8/4B3/8 w - - 0 1'
  const score = scoreTwoBishopsWhiteMove(fen, 'Bh5')

  assert.equal(getMateRuleSet('two-bishops').phase(fen), '2/2')
  assert.equal(score.bootNScootApplies, false)
  assert.equal(score.bootNScootPenalty, 1)
})

test('Two Bishops renders the edge flank through Rule W diagrams', () => {
  const help = getMateRuleSet('two-bishops').help
  assert.deepEqual(help.notes, [
    "Moat modifier means Black may widen the King moat instead of satisfying the rule's requested response.",
  ])
  assert.equal(help.noteBoards.length, 7)
  assert.deepEqual(help.noteBoards[0], {
    id: 'bishop-edge-flank',
    title: 'edge flank',
    caption:
      "Pink squares are White's diagonal flank targets for Black's edge square.",
    layout: { files: 8, ranks: 8, fileOffset: 0 },
    pieces: [
      { square: 'g4', piece: 'K' },
      { square: 'h6', piece: 'k' },
    ],
    highlights: [
      { square: 'f5', kind: 'pink' },
      { square: 'f7', kind: 'pink' },
    ],
    arrows: [{ from: 'g4', to: 'f5' }],
  })
  assert.equal(
    help.noteBoards[0]?.pieces.some(({ piece }) => piece === 'B'),
    false,
  )
  assert.deepEqual(help.noteBoards[1], {
    id: 'bishop-boot-scoot-n-block',
    title: 'boot scoot n block',
    caption: 'Boot the king, scoot to opposition, then block the escape.',
    animationSrc: '/mate/two-bishops/boot-n-scoot.gif',
    animationAlt:
      'Boot Scoot N Block progression: Bg4, Black king to c2, White king to c4, Black king to d2, then Bc5.',
    layout: { files: 8, ranks: 8, fileOffset: 0 },
    pieces: [],
    highlights: [],
  })
  assert.deepEqual(help.noteBoards[2], {
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
      ...['a6', 'b5', 'c4', 'd3', 'e2', 'f1'].map(
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
  assert.deepEqual(help.noteBoards[3], {
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
  assert.deepEqual(help.noteBoards[4], {
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
      { square: 'c8', kind: 'zone' },
      { square: 'd7', kind: 'zone' },
      { square: 'e6', kind: 'zone' },
      { square: 'f5', kind: 'zone' },
      { square: 'g4', kind: 'zone' },
      { square: 'h3', kind: 'zone' },
      { square: 'h1', kind: 'zone' },
    ],
    arrows: [{ from: 'd2', to: 'f4' }],
  })
  assert.deepEqual(help.noteBoards[5], {
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
    help.noteBoards[5]?.pieces.some(({ piece }) => piece === 'k'),
    false,
  )
  assert.deepEqual(help.noteBoards[6], {
    id: 'bishop-king-stutter',
    title: 'king stutter',
    caption: 'Do the arrowed king stutter step.',
    layout: { files: 8, ranks: 8, fileOffset: 0 },
    pieces: [
      { square: 'f6', piece: 'B' },
      { square: 'e5', piece: 'K' },
      { square: 'f5', piece: 'B' },
      { square: 'h5', piece: 'k' },
    ],
    highlights: [],
    arrows: [{ from: 'e5', to: 'e4' }],
  })
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
  }

})

test('Rule S evaluates its geometry in Phase 2', () => {
  const fen = '8/8/8/4B3/8/8/6K1/3Bk3 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const sourceMove = getChess(fen).move('Kg1')

  assert.ok(sourceMove)
  assert.equal(ruleSet.phase(fen), '2/2')
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kg1').ruleSApplies, true)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kg1').ruleSPenalty, 0)

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

test('Rule S checks from either moat-anchored squeeze bundle', () => {
  const fen = '2B5/2B5/8/1k6/3K4/8/8/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  const tertiaryCheck = scoreTwoBishopsWhiteMove(fen, 'Bd7+')
  const ruleWMove = scoreTwoBishopsWhiteMove(fen, 'Bb7')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(tertiaryCheck.ruleSApplies, true)
  assert.equal(tertiaryCheck.ruleSPenalty, 0)
  assert.equal(ruleWMove.ruleSPenalty, 1)

  const sourceMove = getChess(fen).move('Bd7+')
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

test('Rule S falls back to opposition when its tertiary check is unsafe', () => {
  const fen = '8/8/8/8/3K4/4B3/B1k5/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const opposition = scoreTwoBishopsWhiteMove(fen, 'Kc4')
  const centralizesBishop = scoreTwoBishopsWhiteMove(fen, 'Bf7')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(opposition.bishopSafetyPenalty, 0)
  assert.equal(opposition.ruleSApplies, true)
  assert.equal(opposition.ruleSPenalty, 0)
  assert.equal(opposition.centralPiecesPenalty, 1)
  assert.equal(centralizesBishop.centralPiecesPenalty, 0)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kc4'])
})

test('Rule S steps away from primary and Rule T starts behind the moat', () => {
  const fen = '8/8/8/8/6K1/3B4/3B1k2/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  const towardPrimary = scoreTwoBishopsWhiteMove(fen, 'Kf4')
  const kingWait = scoreTwoBishopsWhiteMove(fen, 'Kh3')
  const behindMoves = ['Ba6', 'Bb5']

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(towardPrimary.ruleSApplies, false)
  assert.equal(towardPrimary.ruleSPenalty, 1)
  assert.equal(kingWait.ruleTPenalty, 1)
  for (const san of behindMoves) {
    assert.equal(scoreTwoBishopsWhiteMove(fen, san).ruleTPenalty, 0)
  }
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bc4').ruleTPenalty, 0)
})

test('Rule S requires a bishop on the corrected primary diagonal', () => {
  const fen = '8/8/8/8/1K6/8/2k5/4BB2 w - - 2 2'
  const score = scoreTwoBishopsWhiteMove(fen, 'Kc4')

  assert.equal(getMateRuleSet('two-bishops').phase(fen), '1/2')
  assert.equal(score.ruleSApplies, false)
})

test('Rule S tertiary checks must force moat opposition', () => {
  const horizontalMoatFen =
    '8/4B3/4B3/8/4K3/2k5/8/8 w - - 8 5'
  const horizontalCheck = scoreTwoBishopsWhiteMove(
    horizontalMoatFen,
    'Bf6+',
  )
  assert.equal(horizontalCheck.ruleSApplies, true)
  assert.equal(horizontalCheck.ruleSPenalty, 1)

  const verticalMoatFen =
    '8/8/3B4/3B4/8/3K4/1k6/8 w - - 2 2'
  const verticalCheck = scoreTwoBishopsWhiteMove(verticalMoatFen, 'Be5+')
  assert.equal(verticalCheck.ruleSApplies, true)
  assert.equal(verticalCheck.ruleSPenalty, 1)
})

test('Rule T forces opposition or a wider king moat', () => {
  const fen = '8/4B3/8/8/6K1/3B4/5k2/8 w - - 20 11'
  const ruleSet = getMateRuleSet('two-bishops')
  const forced = scoreTwoBishopsWhiteMove(fen, 'Bc5+')
  const partial = scoreTwoBishopsWhiteMove(fen, 'Bf6')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(forced.ruleTApplies, true)
  assert.equal(forced.ruleTPenalty, 0)
  assert.equal(forced.ruleTReplyCount, 2)
  assert.equal(partial.ruleTApplies, true)
  assert.equal(partial.ruleTPenalty, 1)
  assert.equal(partial.ruleTReplyCount, 99)

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
    const transformedScore = scoreTwoBishopsWhiteMove(
      transformedFen,
      transformedMove.san,
    )
    assert.equal(transformedScore.ruleTApplies, true, transform.name)
    assert.equal(transformedScore.ruleTPenalty, 0, transform.name)
  }

  const phaseTwoFen = '8/8/8/8/8/5K2/7k/3BB3 w - - 0 1'
  assert.equal(ruleSet.phase(phaseTwoFen), '2/2')
  assert.equal(
    scoreTwoBishopsWhiteMove(phaseTwoFen, 'Ke4').ruleTApplies,
    true,
  )
})

test('Rule T moves a bishop from behind the moat to force opposition', () => {
  const fen = '4k3/2B5/5K2/8/8/8/8/7B w - - 22 12'
  const ruleSet = getMateRuleSet('two-bishops')
  const move = scoreTwoBishopsWhiteMove(fen, 'Bc6+')

  assert.equal(ruleSet.phase(fen), '2/2')
  assert.equal(move.ruleTApplies, true)
  assert.equal(move.ruleTPenalty, 0)
  assert.equal(move.ruleTReplyCount, 1)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bc6+'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'rule t')
})

test('Rule T credits a forcing bishop sourced behind the moat', () => {
  const fen = '8/3B4/8/8/8/3K4/3B1k2/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const formerLoopMove = scoreTwoBishopsWhiteMove(fen, 'Bh3')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(formerLoopMove.ruleTApplies, true)
  assert.equal(formerLoopMove.ruleTPenalty, 0)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bh3'])
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Ba4'), false)
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Bh3'), true)

  const sourceMove = getChess(fen).move('Bh3')
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
    const transformedScore = scoreTwoBishopsWhiteMove(
      transformedFen,
      transformedMove.san,
    )
    assert.equal(transformedScore.ruleTApplies, true, transform.name)
    assert.equal(transformedScore.ruleTPenalty, 0, transform.name)
  }
})

test('Rule T allows a bishop sourced behind the moat to cross it', () => {
  const fen = '8/8/5B2/8/1KB5/8/2k5/8 w - - 2 2'
  const loopMove = scoreTwoBishopsWhiteMove(fen, 'Bc3')

  assert.equal(loopMove.ruleTApplies, true)
  assert.equal(loopMove.ruleTPenalty, 0)
  assert.equal(
    getMateRuleSet('two-bishops').idealWhiteMoves(fen).includes('Bc3'),
    false,
  )
})

test('Rule T credits a Phase 2 bishop sourced behind the moat', () => {
  const fen = '5k2/8/5BK1/5B2/8/8/8/8 w - - 6 4'
  const ruleSet = getMateRuleSet('two-bishops')
  const sourceMove = getChess(fen).move('Bd7')
  assert.ok(sourceMove)

  const legalMoves = getChess(fen).moves()
  const scores = legalMoves.map((san) => ({
    san,
    score: scoreTwoBishopsWhiteMove(fen, san),
  }))
  assert.equal(ruleSet.phase(fen), '2/2')
  assert.equal(scores.every(({ score }) => score.ruleTApplies), true)
  assert.deepEqual(
    scores
      .filter(({ score }) => score.ruleTPenalty === 0)
      .map(({ san }) => san),
    ['Bd7'],
  )
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bd7').ruleTPenalty, 0)

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
    assert.equal(transformedScore.ruleTApplies, true, transform.name)
    assert.equal(transformedScore.ruleTPenalty, 0, transform.name)
  }
})

test('Rule T counts replies for bishops that finish behind White', () => {
  const fen = '8/4B3/8/8/6K1/3B4/5k2/8 w - - 20 11'
  const fewerReplies = scoreTwoBishopsWhiteMove(fen, 'Bc5+')
  const moreReplies = scoreTwoBishopsWhiteMove(fen, 'Bg5')

  assert.equal(fewerReplies.ruleSApplies, true)
  assert.equal(fewerReplies.ruleSPenalty, 0)
  assert.equal(fewerReplies.ruleTPenalty, 0)
  assert.equal(fewerReplies.ruleTReplyCount, 2)
  assert.equal(moreReplies.ruleTPenalty, 0)
  assert.equal(moreReplies.ruleTReplyCount, 3)

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
  }
})

test('Rule R recalculates knight geometry after White moves', () => {
  const fen = '8/8/8/2K5/3B4/1k1B4/8/8 w - - 4 3'
  const move = scoreTwoBishopsWhiteMove(fen, 'Kd5')

  assert.equal(move.ruleRApplies, true)
  assert.equal(move.ruleRPenalty, 1)
  assert.notEqual(getMateRuleSet('two-bishops').currentWhiteHint(fen)?.id, 'rule r')
})

test('Rule Z1 moves from completed flank diagonals to the primary squeeze diagonal', () => {
  const fen = '8/8/8/6k1/2B1K3/2B5/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const sourceMove = getChess(fen).move('Bf7')

  assert.ok(sourceMove)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf7').ruleZ1Applies, true)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf7').ruleZ1Penalty, 0)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bf7'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'rule z1')

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
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, transformedMove.san)
        .ruleZ1Penalty,
      0,
      transform.name,
    )
  }
})

test('Rule Z1 supports a primary squeeze diagonal anchored beyond the edge', () => {
  const fen = '8/8/4BK2/4B2k/8/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const sourceMove = getChess(fen).move('Bg3')

  assert.ok(sourceMove)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bg3').ruleZ1Applies, true)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bg3').ruleZ1Penalty, 0)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bg3'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'rule z1')

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
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, transformedMove.san)
        .ruleZ1Penalty,
      0,
      transform.name,
    )
  }
})

test('Rule U takes prepared opposition after Rule T', () => {
  const fen = '8/1k6/3K1B2/8/8/3B4/8/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  const opposition = scoreTwoBishopsWhiteMove(fen, 'Kd7')
  const otherMove = scoreTwoBishopsWhiteMove(fen, 'Kc5')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(opposition.ruleUApplies, true)
  assert.equal(opposition.ruleUPenalty, 0)
  assert.equal(otherMove.ruleUApplies, true)
  assert.equal(otherMove.ruleUPenalty, 1)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kd7'])

  const sourceMove = getChess(fen).move('Kd7')
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
    assert.equal(score.ruleUApplies, true, transform.name)
    assert.equal(score.ruleUPenalty, 0, transform.name)
    assert.deepEqual(
      ruleSet.idealWhiteMoves(transformedFen),
      [transformedMove.san],
      transform.name,
    )
  }

  const phaseTwoFen = '8/8/8/2B5/k1B5/8/1K6/8 w - - 0 1'
  const phaseTwoMove = getChess(phaseTwoFen).move('Ka2')
  assert.ok(phaseTwoMove)
  assert.equal(ruleSet.phase(phaseTwoFen), '2/2')
  assert.equal(
    scoreTwoBishopsWhiteMove(phaseTwoFen, 'Ka2').ruleUApplies,
    false,
  )
  assert.equal(
    scoreTwoBishopsWhiteMove(phaseTwoFen, 'Ka2').ruleUPenalty,
    1,
  )
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(
      transformFen(phaseTwoFen, transform),
    ).fen()
    const transformedMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(phaseTwoMove.from, transform) &&
          to === transformSquare(phaseTwoMove.to, transform),
      )
    assert.ok(transformedMove, transform.name)
    const score = scoreTwoBishopsWhiteMove(
      transformedFen,
      transformedMove.san,
    )
    assert.equal(score.ruleUApplies, false, transform.name)
    assert.equal(score.ruleUPenalty, 1, transform.name)
  }
})

test('Rule U requires distinct bishop roles and secondary occupancy', () => {
  const sameColorFen =
    '8/1k6/3KB3/8/8/3B4/8/8 w - - 0 1'
  const screenedFen =
    '4B3/1k6/3K1B2/8/8/8/8/8 w - - 0 1'
  const wrongMoatSideFen =
    '8/1k6/3K1B2/1B6/8/8/8/8 w - - 0 1'

  assert.equal(
    scoreTwoBishopsWhiteMove(sameColorFen, 'Kd7').ruleUApplies,
    false,
  )
  assert.equal(
    scoreTwoBishopsWhiteMove(screenedFen, 'Kd7').ruleUApplies,
    false,
  )
  assert.equal(
    scoreTwoBishopsWhiteMove(wrongMoatSideFen, 'Kd7').ruleUApplies,
    false,
  )
})

test('Rule U accepts a legal move that maintains primary control', () => {
  const fen = '8/8/5B2/5B2/8/5K2/7k/8 w - - 34 18'
  const ruleSet = getMateRuleSet('two-bishops')
  const sourceMove = getChess(fen).move('Kf2')
  const score = scoreTwoBishopsWhiteMove(fen, 'Kf2')

  assert.ok(sourceMove)
  assert.equal(ruleSet.phase(fen), '2/2')
  assert.equal(score.ruleUApplies, true)
  assert.equal(score.ruleUPenalty, 0)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kf2'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'rule u')

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
    assert.equal(transformedScore.ruleUApplies, true, transform.name)
    assert.equal(transformedScore.ruleUPenalty, 0, transform.name)
    assert.deepEqual(
      ruleSet.idealWhiteMoves(transformedFen),
      [transformedMove.san],
      transform.name,
    )
  }
})

test('Rule U rejects opposition toward the squeeze diagonal', () => {
  const fen = '8/4B3/8/4k2B/2K5/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const sourceMove = getChess(fen).move('Kc5')

  assert.ok(sourceMove)
  assert.equal(ruleSet.phase(fen), '1/2')

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
    assert.equal(score.ruleUApplies, false, transform.name)
    assert.equal(score.ruleUPenalty, 1, transform.name)
    assert.equal(
      ruleSet.idealWhiteMoves(transformedFen).includes(
        transformedMove.san,
      ),
      false,
      transform.name,
    )
    assert.notEqual(ruleSet.currentWhiteHint(transformedFen)?.id, 'rule u')
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
  }

  const phaseTwoFen = '8/6B1/8/8/5K1k/3B4/8/8 w - - 30 16'
  const phaseTwoMove = getChess(phaseTwoFen).move('Bg6')
  const phaseTwoCentralMove = scoreTwoBishopsWhiteMove(phaseTwoFen, 'Bc3')
  assert.ok(phaseTwoMove)
  assert.equal(ruleSet.phase(phaseTwoFen), '2/2')
  assert.equal(
    scoreTwoBishopsWhiteMove(phaseTwoFen, 'Bg6').ruleVApplies,
    true,
  )
  assert.equal(
    scoreTwoBishopsWhiteMove(phaseTwoFen, 'Bg6').ruleVPenalty,
    0,
  )
  assert.equal(
    scoreTwoBishopsWhiteMove(phaseTwoFen, 'Bg6').centralPiecesPenalty,
    1,
  )
  assert.equal(phaseTwoCentralMove.centralPiecesPenalty, 0)
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(
      transformFen(phaseTwoFen, transform),
    ).fen()
    const transformedMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(phaseTwoMove.from, transform) &&
          to === transformSquare(phaseTwoMove.to, transform),
      )
    assert.ok(transformedMove, transform.name)
    const score = scoreTwoBishopsWhiteMove(
      transformedFen,
      transformedMove.san,
    )
    assert.equal(score.ruleVApplies, true, transform.name)
    assert.equal(score.ruleVPenalty, 0, transform.name)
  }
})

test("Rule V lets the secondary bishop x-ray through White's king", () => {
  const fen = '8/8/8/8/8/1k1KB3/4B3/8 w - - 10 6'
  const ruleSet = getMateRuleSet('two-bishops')
  const sourceMove = getChess(fen).move('Bc5')

  assert.ok(sourceMove)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bc5'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'rule v')

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

test('Rule V keeps the resulting primary and secondary in one squeeze bundle', () => {
  const fen = '8/8/3k4/6B1/3K4/3B4/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const preferred = getChess(fen).move('Bf5')
  const rejected = getChess(fen).move('Bb5')
  assert.ok(preferred)
  assert.ok(rejected)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf5').ruleVPenalty, 0)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bb5').ruleVPenalty, 1)
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Bb5'), false)

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
    const legalMoves = getChess(transformedFen).moves({ verbose: true })
    const transformedPreferred = legalMoves.find(
      ({ from, to }) =>
        from === transformSquare(preferred.from, transform) &&
        to === transformSquare(preferred.to, transform),
    )
    const transformedRejected = legalMoves.find(
      ({ from, to }) =>
        from === transformSquare(rejected.from, transform) &&
        to === transformSquare(rejected.to, transform),
    )
    assert.ok(transformedPreferred, transform.name)
    assert.ok(transformedRejected, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(
        transformedFen,
        transformedPreferred.san,
      ).ruleVPenalty,
      0,
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(
        transformedFen,
        transformedRejected.san,
      ).ruleVPenalty,
      1,
      transform.name,
    )
  }
})

test('Rule V prepares a matched bundle when no secondary is controlled yet', () => {
  const fen = '8/4k3/8/4K3/8/3BB3/8/8 w - - 0 1'
  const sourceMove = getChess(fen).move('Bb5')
  assert.ok(sourceMove)
  const score = scoreTwoBishopsWhiteMove(fen, 'Bb5')
  assert.equal(score.ruleVApplies, true)
  assert.equal(score.ruleVPenalty, 0)

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
    assert.equal(transformedScore.ruleVApplies, true, transform.name)
    assert.equal(transformedScore.ruleVPenalty, 0, transform.name)
  }
})

test('Rule V prefers the squeeze anchor farther from the edge', () => {
  const fen = '8/8/3B2k1/3B4/6K1/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const preferred = scoreTwoBishopsWhiteMove(fen, 'Be5')
  const edgeBundle = scoreTwoBishopsWhiteMove(fen, 'Bf8')
  const preferredMove = getChess(fen).move('Be5')
  const edgeMove = getChess(fen).move('Bf8')

  assert.ok(preferredMove)
  assert.ok(edgeMove)
  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(preferred.ruleVPenalty, 0)
  assert.equal(edgeBundle.ruleVPenalty, 1)
  assert.equal(preferred.ruleVSqueezeEdgeDistance, 2)
  assert.equal(edgeBundle.ruleVSqueezeEdgeDistance, 0)

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
    const legalMoves = getChess(transformedFen).moves({ verbose: true })
    const transformedPreferred = legalMoves.find(
      ({ from, to }) =>
        from === transformSquare(preferredMove.from, transform) &&
        to === transformSquare(preferredMove.to, transform),
    )
    const transformedEdge = legalMoves.find(
      ({ from, to }) =>
        from === transformSquare(edgeMove.from, transform) &&
        to === transformSquare(edgeMove.to, transform),
    )
    assert.ok(transformedPreferred, transform.name)
    assert.ok(transformedEdge, transform.name)
    assert.ok(
      scoreTwoBishopsWhiteMove(
        transformedFen,
        transformedPreferred.san,
      ).ruleVSqueezeEdgeDistance >
        scoreTwoBishopsWhiteMove(
          transformedFen,
          transformedEdge.san,
        ).ruleVSqueezeEdgeDistance,
      transform.name,
    )
  }
})

test('Rule V prepares a matched squeeze bundle on either side of opposition', () => {
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
  }
})

test('Rule V keeps primary and secondary on one Black flank', () => {
  const fen = '8/3k4/B7/3K4/8/8/5B2/8 w - - 0 1'
  const sameFlank = scoreTwoBishopsWhiteMove(fen, 'Bb6')
  const crossFlank = scoreTwoBishopsWhiteMove(fen, 'Bh4')

  assert.equal(sameFlank.ruleVApplies, true)
  assert.equal(sameFlank.ruleVPenalty, 0)
  assert.equal(crossFlank.ruleVApplies, true)
  assert.equal(crossFlank.ruleVPenalty, 1)
  assert.equal(sameFlank.centralPiecesPenalty, 1)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Be2').centralPiecesPenalty, 0)

  const sourceMove = getChess(fen).move('Bb6')
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
  }
})

test('Rule V checks from secondary when primary is already controlled', () => {
  const fen = '8/8/4K1k1/8/5BB1/8/8/8 w - - 0 1'
  const secondaryCheck = scoreTwoBishopsWhiteMove(fen, 'Bh5+')
  const quietMove = scoreTwoBishopsWhiteMove(fen, 'Bg5')

  assert.equal(getMateRuleSet('two-bishops').phase(fen), '1/2')
  assert.equal(secondaryCheck.ruleVApplies, true)
  assert.equal(secondaryCheck.ruleVPenalty, 0)
  assert.equal(secondaryCheck.bishopSafetyPenalty, 1)
  assert.equal(quietMove.ruleVApplies, true)
  assert.equal(quietMove.ruleVPenalty, 1)

  const sourceMove = getChess(fen).move('Bh5+')
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
    assert.equal(score.bishopSafetyPenalty, 1, transform.name)
  }
})

test('Rule V lets the matching secondary controller leave its diagonal to check', () => {
  const fen = '8/4k3/1B6/1B2K3/8/8/8/8 w - - 0 1'
  const sourceMove = getChess(fen).move('Bc5+')
  assert.ok(sourceMove)
  const score = scoreTwoBishopsWhiteMove(fen, 'Bc5+')
  assert.equal(score.ruleVApplies, true)
  assert.equal(score.ruleVPenalty, 0)

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
    assert.equal(transformedScore.ruleVApplies, true, transform.name)
    assert.equal(transformedScore.ruleVPenalty, 0, transform.name)
  }
})

test('Rule V checks with the matching secondary controller by origin', () => {
  const fen = '8/3B4/3B4/8/8/1k1K4/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const secondaryCheck = scoreTwoBishopsWhiteMove(fen, 'Be6+')
  const quietMove = scoreTwoBishopsWhiteMove(fen, 'Bc7')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(secondaryCheck.ruleVApplies, true)
  assert.equal(secondaryCheck.ruleVPenalty, 0)
  assert.equal(quietMove.ruleVApplies, true)
  assert.equal(quietMove.ruleVPenalty, 1)

  const sourceMove = getChess(fen).move('Be6+')
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
  }
})

test('Rule V checks from the side of an existing primary squeeze diagonal', () => {
  const fen = '8/3B4/8/8/1B6/4K1k1/8/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  const squeezeSideCheck = scoreTwoBishopsWhiteMove(fen, 'Bd6+')
  const oppositeSideCheck = scoreTwoBishopsWhiteMove(fen, 'Be1+')
  const formerLoopMove = scoreTwoBishopsWhiteMove(fen, 'Bb5')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(squeezeSideCheck.ruleVApplies, true)
  assert.equal(squeezeSideCheck.ruleVPenalty, 0)
  assert.equal(oppositeSideCheck.ruleVPenalty, 1)
  assert.equal(formerLoopMove.ruleVPenalty, 1)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bd6+'])
})

test('Rule W completes or preserves both flank diagonals', () => {
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
  assert.equal(preserved.centralPiecesPenalty, 1)
  assert.equal(
    scoreTwoBishopsWhiteMove(diagonalFen, 'Ke4').ruleWPenalty,
    0,
  )
  assert.equal(
    ruleSet.explainWhiteMove(diagonalFen, 'Ke4')?.id,
    'unscreen bishops',
  )
})

test('Rule W derives geometry after White moves and accepts king moves', () => {
  const fen = '8/8/8/8/k7/2KB4/3B4/8 w - - 56 29'
  const ruleSet = getMateRuleSet('two-bishops')
  const kingMove = scoreTwoBishopsWhiteMove(fen, 'Kc2')
  const noGeometry = scoreTwoBishopsWhiteMove(fen, 'Kc4')

  assert.equal(ruleSet.phase(fen), '2/2')
  assert.equal(kingMove.ruleWApplies, true)
  assert.equal(kingMove.ruleWPenalty, 0)
  assert.equal(noGeometry.ruleWPenalty, 1)
  assert.equal(ruleSet.explainWhiteMove(fen, 'Kc4')?.id, 'rule w')
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'king closer')
})

test('Rule Z2 preserves a completed two-diagonal pair with a bishop move', () => {
  const fen = '8/8/8/6k1/8/2B1K3/2B5/8 w - - 2 2'
  const preservingBishop = scoreTwoBishopsWhiteMove(fen, 'Bb2')
  const kingMove = scoreTwoBishopsWhiteMove(fen, 'Ke4')

  assert.equal(preservingBishop.ruleZ2Applies, true)
  assert.equal(preservingBishop.ruleZ2Penalty, 0)
  assert.equal(kingMove.ruleZ2Applies, true)
  assert.equal(kingMove.ruleZ2Penalty, 1)
  assert.ok(
    twoBishopsWhiteRules.findIndex(({ id }) => id === 'rule z2') <
      twoBishopsWhiteRules.findIndex(({ id }) => id === 'king closer'),
  )
})

test('Rule W rejects a completed pair when a diagonal misses the moat', () => {
  const fen = '8/8/6k1/8/5K2/8/4BB2/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const advance = scoreTwoBishopsWhiteMove(fen, 'Ke5')
  const formerLoopMove = scoreTwoBishopsWhiteMove(fen, 'Bf3')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(advance.ruleWApplies, false)
  assert.equal(advance.ruleWPenalty, 1)
  assert.equal(formerLoopMove.ruleWPenalty, 1)
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Ke5'), false)
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Bf3'), false)

  const sourceAdvance = getChess(fen).move('Ke5')
  assert.ok(sourceAdvance)
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
    const transformedAdvance = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(sourceAdvance.from, transform) &&
          to === transformSquare(sourceAdvance.to, transform),
      )
    assert.ok(transformedAdvance, transform.name)
    const transformedScore = scoreTwoBishopsWhiteMove(
      transformedFen,
      transformedAdvance.san,
    )
    assert.equal(transformedScore.ruleWApplies, false, transform.name)
    assert.equal(transformedScore.ruleWPenalty, 1, transform.name)
  }
})

test('Rule W rejects priority partial credit when the pair misses the moat', () => {
  const fen = '8/8/8/8/5K2/BB6/6k1/8 w - - 0 1'
  const urgent = scoreTwoBishopsWhiteMove(fen, 'Be6')
  const otherFlank = scoreTwoBishopsWhiteMove(fen, 'Be7')
  const opposition = scoreTwoBishopsWhiteMove(fen, 'Kg4')

  assert.equal(urgent.ruleUApplies, false)
  assert.equal(urgent.ruleWApplies, false)
  assert.equal(urgent.ruleWUrgentPenalty, 0)
  assert.equal(otherFlank.ruleWUrgentPenalty, 0)
  assert.equal(opposition.ruleWUrgentPenalty, 0)

  const sourceMove = getChess(fen).move('Be6')
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
    assert.equal(score.ruleUApplies, false, transform.name)
    assert.equal(score.ruleWApplies, false, transform.name)
    assert.equal(score.ruleWUrgentPenalty, 0, transform.name)
  }
})

test('Rule W priority partial credit scores the supplied Bb2 setup', () => {
  const fen = '8/8/8/6k1/4K3/B7/2B5/8 w - - 2 2'
  const priority = scoreTwoBishopsWhiteMove(fen, 'Bb2')
  const kingMove = scoreTwoBishopsWhiteMove(fen, 'Ke5')
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(priority.ruleWApplies, true)
  assert.equal(priority.ruleWPenalty, 1)
  assert.equal(priority.ruleWUrgentPenalty, 0)
  assert.equal(kingMove.ruleWPenalty, 1)
  assert.equal(kingMove.ruleWUrgentPenalty, 1)
  assert.equal(priority.centralPiecesPenalty, 1)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bb4').centralPiecesPenalty, 0)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bb2'])
  assert.equal(ruleSet.explainWhiteMove(fen, 'Bb2')?.id, 'rule w')
})

test('Rule W ignores a screened incomplete flank pair', () => {
  const fen = '8/5k2/8/5K2/6BB/8/8/8 w - - 0 1'
  const screened = scoreTwoBishopsWhiteMove(fen, 'Kg5')
  const noGeometry = scoreTwoBishopsWhiteMove(fen, 'Bh5+')
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(screened.unscreenBishopsCount, 1)
  assert.equal(screened.ruleWPenalty, 1)
  assert.equal(noGeometry.ruleWPenalty, 1)
  assert.equal(screened.ruleWApplies, false)
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Kg5'), false)
  assert.notEqual(ruleSet.currentWhiteHint(fen)?.id, 'rule w')
})

test("Rule W two-step flank diagonals must reach Black's file", () => {
  const fen = '8/5B2/8/2B5/4K3/8/6k1/8 w - - 4 3'
  const ruleSet = getMateRuleSet('two-bishops')
  const sourceMove = getChess(fen).move('Bc4')
  const score = scoreTwoBishopsWhiteMove(fen, 'Bc4')

  assert.ok(sourceMove)
  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(score.ruleWApplies, false)
  assert.equal(score.ruleWPenalty, 1)
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Bc4'), false)
  assert.notEqual(ruleSet.currentWhiteHint(fen)?.id, 'rule w')

  for (const transform of SQUARE_TRANSFORMS.filter(({ name }) =>
    ['identity', 'rotate180', 'mirrorFile', 'mirrorRank'].includes(name),
  )) {
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
    assert.equal(transformedScore.ruleWApplies, false, transform.name)
    assert.equal(transformedScore.ruleWPenalty, 1, transform.name)
    assert.equal(
      ruleSet.idealWhiteMoves(transformedFen).includes(
        transformedMove.san,
      ),
      false,
      transform.name,
    )
  }
})

test("Rule W two-step flank diagonals must also reach Black's rank", () => {
  const fen = '8/8/7k/8/1B3K2/5B2/8/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  const falseFlank = scoreTwoBishopsWhiteMove(fen, 'Be1')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(falseFlank.ruleWApplies, false)
  assert.equal(falseFlank.ruleWPenalty, 1)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kf5'])
  assert.equal(ruleSet.explainWhiteMove(fen, 'Be1')?.id, 'king closer')
})

test('Rule W knight-step flank diagonals must intersect the king moat', () => {
  const fen = '8/3B4/8/8/8/3K4/3B1k2/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const sourceMove = getChess(fen).move('Ba4')

  assert.ok(sourceMove)
  assert.equal(ruleSet.phase(fen), '1/2')

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
    assert.equal(score.ruleWApplies, false, transform.name)
    assert.equal(score.ruleWPenalty, 1, transform.name)
    assert.equal(
      ruleSet.idealWhiteMoves(transformedFen).includes(
        transformedMove.san,
      ),
      false,
      transform.name,
    )
    assert.notEqual(ruleSet.currentWhiteHint(transformedFen)?.id, 'rule w')
  }
})

test('unscreen bishops still breaks ties after invalid Rule W geometry', () => {
  const fen = '8/6k1/4K3/1BB5/8/8/8/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  const unscreened = scoreTwoBishopsWhiteMove(fen, 'Bc6')
  const screened = scoreTwoBishopsWhiteMove(fen, 'Bd7')

  assert.equal(unscreened.ruleWApplies, false)
  assert.equal(unscreened.ruleWPenalty, 1)
  assert.equal(screened.ruleWPenalty, 1)
  assert.equal(unscreened.unscreenBishopsCount, 0)
  assert.equal(screened.unscreenBishopsCount, 1)
  const unscreenRule = twoBishopsWhiteRules.find(
    ({ id }) => id === 'unscreen bishops',
  )
  assert.ok(unscreenRule?.compare)
  assert.ok(unscreenRule.compare(unscreened, screened) < 0)
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Bd7'), false)
  assert.equal(ruleSet.explainWhiteMove(fen, 'Bd7')?.id, 'unscreen bishops')
})

test('Rule Y gives no credit when prevention does not separate kings', () => {
  const fen = '8/8/3B4/8/B2k4/8/8/7K w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const preferred = scoreTwoBishopsWhiteMove(fen, 'Bb3')
  const alsoPrevents = scoreTwoBishopsWhiteMove(fen, 'Bc6')
  const movesThreatenedBishop = scoreTwoBishopsWhiteMove(fen, 'Bc7')
  const kingMove = scoreTwoBishopsWhiteMove(fen, 'Kg2')

  assert.equal(preferred.ruleYApplies, true)
  assert.equal(preferred.ruleYPenalty, 1)
  assert.equal(alsoPrevents.ruleYPenalty, 1)
  assert.equal(movesThreatenedBishop.ruleYPenalty, 1)
  assert.equal(kingMove.ruleYPenalty, 1)
  const ruleY = twoBishopsWhiteRules.find(({ id }) => id === 'rule y')
  assert.ok(ruleY?.compare)
  assert.equal(ruleY.compare(preferred, movesThreatenedBishop), 0)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kg2'])
  assert.equal(ruleSet.explainWhiteMove(fen, 'Bb3')?.id, 'king closer')

  const sourcePreferred = getChess(fen).move('Bb3')
  const sourceRejected = getChess(fen).move('Bc7')
  assert.ok(sourcePreferred)
  assert.ok(sourceRejected)

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
    const transformedPreferred = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(sourcePreferred.from, transform) &&
          to === transformSquare(sourcePreferred.to, transform),
      )
    const transformedRejected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(sourceRejected.from, transform) &&
          to === transformSquare(sourceRejected.to, transform),
      )
    assert.ok(transformedPreferred, transform.name)
    assert.ok(transformedRejected, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(
        transformedFen,
        transformedPreferred.san,
      ).ruleYPenalty,
      1,
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(
        transformedFen,
        transformedRejected.san,
      ).ruleYPenalty,
      1,
      transform.name,
    )
  }

  const noThreatFen = '8/8/1BB5/8/6K1/8/8/4k3 w - - 4 3'
  assert.equal(
    scoreTwoBishopsWhiteMove(noThreatFen, 'Ba7').ruleYApplies,
    false,
  )
})

test('paused Rule Y retains its protective-move scoring without affecting selection', () => {
  const fen = '8/8/8/8/2B2K2/2B5/8/3k4 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  const separating = scoreTwoBishopsWhiteMove(fen, 'Bd3')
  const notSeparating = scoreTwoBishopsWhiteMove(fen, 'Bb3+')

  assert.equal(separating.ruleYPenalty, 0)
  assert.equal(notSeparating.ruleYPenalty, 1)
  const ruleY = twoBishopsWhiteRules.find(({ id }) => id === 'rule y')
  assert.equal(ruleY?.applies?.(separating), false)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Ke3'])
  assert.equal(ruleSet.explainWhiteMove(fen, 'Bd3')?.id, 'king closer')
  assert.equal(ruleSet.explainWhiteMove(fen, 'Bb3+')?.id, 'king closer')

  const sourcePreferred = getChess(fen).move('Bd3')
  assert.ok(sourcePreferred)
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
    const transformedPreferred = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(sourcePreferred.from, transform) &&
          to === transformSquare(sourcePreferred.to, transform),
      )
    assert.ok(transformedPreferred, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(
        transformedFen,
        transformedPreferred.san,
      ).ruleYPenalty,
      0,
      transform.name,
    )
  }
})

test('Rule Y rejects the non-separating move from the former loop', () => {
  const fen = '8/5K2/B1k5/8/5B2/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const formerLoopMove = scoreTwoBishopsWhiteMove(fen, 'Be3')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(formerLoopMove.ruleYApplies, true)
  assert.equal(formerLoopMove.ruleYPenalty, 1)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Ke6'])
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Be3'), false)
})

test('Rule Y rejects a protecting bishop Black can attack next', () => {
  const fen = '8/8/1B6/5k1B/8/2K5/8/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  const sourceMove = getChess(fen).move('Be3')

  assert.ok(sourceMove)
  assert.equal(ruleSet.phase(fen), '1/2')

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
    assert.equal(score.ruleYApplies, true, transform.name)
    assert.equal(score.ruleYPenalty, 1, transform.name)
    assert.equal(
      ruleSet.idealWhiteMoves(transformedFen).includes(
        transformedMove.san,
      ),
      false,
      transform.name,
    )
  }
})

test('Rule W requires eligible starting king geometry', () => {
  const fen = '8/4B1k1/4B3/8/5K2/8/8/8 w - - 14 8'
  const kingMove = scoreTwoBishopsWhiteMove(fen, 'Kg5')
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(kingMove.ruleWApplies, false)
  assert.equal(ruleSet.explainWhiteMove(fen, 'Kg5')?.id, 'king closer')
  assert.notEqual(ruleSet.currentWhiteHint(fen)?.id, 'rule w')
})

test('Rule W is rotation/reflection invariant and applies only after Phase 1 moves', () => {
  const phaseOneFen = '6k1/8/8/8/4K3/8/2B5/B7 w - - 0 1'
  const sourceMove = getChess(phaseOneFen).move('Bd1')
  assert.ok(sourceMove)

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(phaseOneFen, transform)).fen()
    const transformedMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    assert.ok(transformedMove, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, transformedMove.san)
        .ruleWApplies,
      true,
      transform.name,
    )
  }

  assert.equal(
    scoreTwoBishopsWhiteMove(phaseOneFen, 'Bb1').ruleWApplies,
    false,
  )

  const phaseTwoFen = '8/8/8/8/k7/2KB4/3B4/8 w - - 56 29'
  assert.equal(isTwoBishopsPhaseTwoPosition(phaseTwoFen), true)
  assert.equal(
    scoreTwoBishopsWhiteMove(phaseTwoFen, 'Kc2').ruleWApplies,
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

test('king closer prioritizes proximity to the middle sixteen', () => {
  const fen = '8/8/8/8/K7/3B4/8/k3B3 w - - 0 1'
  const central = scoreTwoBishopsWhiteMove(fen, 'Kb4')
  const closerToBlack = scoreTwoBishopsWhiteMove(fen, 'Ba6')
  assert.equal(central.kingCloserMiddleSixteenDistance, 1)
  assert.equal(closerToBlack.kingCloserMiddleSixteenDistance, 2)
  assert.equal(central.kingCloserDistance, 10)
  assert.equal(closerToBlack.kingCloserDistance, 9)
  const kingCloser = twoBishopsWhiteRules.find(({ id }) => id === 'king closer')
  assert.ok(kingCloser?.compare)
  assert.ok(kingCloser.compare(central, closerToBlack) < 0)
})

test('king closer applies its middle-sixteen and distance priorities in Phase 1', () => {
  const fen = '3K4/1k1B4/3B4/8/8/8/8/8 w - - 4 3'
  const bishopMove = scoreTwoBishopsWhiteMove(fen, 'Bc5')
  const kingMove = scoreTwoBishopsWhiteMove(fen, 'Ke7')
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(bishopMove.kingCloserDistance, 5)
  assert.equal(bishopMove.kingCloserMiddleSixteenDistance, 2)
  assert.equal(kingMove.kingCloserDistance, 9)
  assert.equal(kingMove.kingCloserMiddleSixteenDistance, 1)
  const kingCloser = twoBishopsWhiteRules.find(({ id }) => id === 'king closer')
  assert.equal(kingCloser?.applies, undefined)
  assert.ok(kingCloser?.compare)
  assert.ok(kingCloser.compare(kingMove, bishopMove) < 0)
})

test('king closer uses squared king distance after middle-sixteen ties', () => {
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
  assert.equal(fartherCentral.kingCloserMiddleSixteenDistance, 0)
  assert.equal(central.kingCloserDistance, 10)
  assert.equal(fartherCentral.kingCloserDistance, 13)
  assert.ok(kingCloser.compare(central, fartherCentral) < 0)
  assert.ok(kingCloser.compare(fartherCentral, outside) < 0)

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

test('unscreen bishops prefers fewer bishops on the White king diagonals', () => {
  const fen = '7k/8/8/8/3K4/B7/B7/8 w - - 0 1'
  const screened = scoreTwoBishopsWhiteMove(fen, 'Bc5')
  const clear = scoreTwoBishopsWhiteMove(fen, 'Bd6')
  const rule = twoBishopsWhiteRules.find(
    ({ id }) => id === 'unscreen bishops',
  )
  assert.ok(rule?.compare)
  assert.equal(screened.unscreenBishopsCount, 1)
  assert.equal(clear.unscreenBishopsCount, 0)
  assert.ok(rule.compare(clear, screened) < 0)

  const screenedMove = getChess(fen).move('Bc5')
  const clearMove = getChess(fen).move('Bd6')
  assert.ok(screenedMove)
  assert.ok(clearMove)
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
    const moves = getChess(transformedFen).moves({ verbose: true })
    const transformedScreened = moves.find(
      ({ from, to }) =>
        from === transformSquare(screenedMove.from, transform) &&
        to === transformSquare(screenedMove.to, transform),
    )
    const transformedClear = moves.find(
      ({ from, to }) =>
        from === transformSquare(clearMove.from, transform) &&
        to === transformSquare(clearMove.to, transform),
    )
    assert.ok(transformedScreened, transform.name)
    assert.ok(transformedClear, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(
        transformedFen,
        transformedScreened.san,
      ).unscreenBishopsCount,
      1,
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(
        transformedFen,
        transformedClear.san,
      ).unscreenBishopsCount,
      0,
      transform.name,
    )
  }
})

test('bishop distance sums only onsides bishop Euclidean distances', () => {
  const suppliedFen = '8/8/2K5/8/1kBB4/8/8/8 w - - 2 2'
  const suppliedFartherMove = getChess(suppliedFen).move('Bf1')
  const suppliedNearerMove = getChess(suppliedFen).move('Ba6')
  const offsides = scoreTwoBishopsWhiteMove(suppliedFen, 'Bf1')
  const onsides = scoreTwoBishopsWhiteMove(suppliedFen, 'Ba6')
  const rule = twoBishopsWhiteRules.find(
    ({ id }) => id === 'bishop distance',
  )

  assert.ok(suppliedFartherMove)
  assert.ok(suppliedNearerMove)
  assert.ok(rule?.compare)
  assert.equal(offsides.bishopDistance, 0)
  assert.equal(onsides.bishopDistance, Math.sqrt(5))
  assert.ok(rule.compare(onsides, offsides) < 0)
  assert.equal(
    scoreTwoBishopsWhiteMove(suppliedFen, 'Bf1').centralPiecesPenalty,
    1,
  )
  assert.equal(
    scoreTwoBishopsWhiteMove(suppliedFen, 'Be2').centralPiecesPenalty,
    0,
  )
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(
      transformFen(suppliedFen, transform),
    ).fen()
    const transformedMoves = getChess(transformedFen).moves({ verbose: true })
    const transformedFarther = transformedMoves.find(
      ({ from, to }) =>
        from === transformSquare(suppliedFartherMove.from, transform) &&
        to === transformSquare(suppliedFartherMove.to, transform),
    )
    assert.ok(transformedFarther, transform.name)
    const transformedNearer = transformedMoves.find(
      ({ from, to }) =>
        from === transformSquare(suppliedNearerMove.from, transform) &&
        to === transformSquare(suppliedNearerMove.to, transform),
    )
    assert.ok(transformedNearer, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(
        transformedFen,
        transformedFarther.san,
      ).bishopDistance,
      0,
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(
        transformedFen,
        transformedNearer.san,
      ).bishopDistance,
      Math.sqrt(5),
      transform.name,
    )
  }
})

test('bishop distance sums exact Euclidean distances', () => {
  const fen = '8/3B4/8/2B5/4k3/8/2K5/8 w - - 0 1'
  const straight = scoreTwoBishopsWhiteMove(fen, 'Bb4')
  const diagonal = scoreTwoBishopsWhiteMove(fen, 'Bb6')
  const rule = twoBishopsWhiteRules.find(
    ({ id }) => id === 'bishop distance',
  )

  assert.ok(rule?.compare)
  assert.equal(straight.bishopDistance, 3 + Math.sqrt(10))
  assert.equal(diagonal.bishopDistance, Math.sqrt(13) + Math.sqrt(10))
  assert.ok(rule.compare(diagonal, straight) < 0)
})

test('bishop distance falls back to both bishops without a recognized moat', () => {
  const fen = '8/8/7B/7k/8/8/2B1K3/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bd2'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'bishop distance')
})

test('bishop distance uses both moats when kings are two diagonal squares apart', () => {
  const fen = '8/3B4/8/8/4kB2/8/2K5/8 w - - 0 1'
  const fartherMove = getChess(fen).move('Bc7')
  const nearerMove = getChess(fen).move('Bd6')
  const rule = twoBishopsWhiteRules.find(
    ({ id }) => id === 'bishop distance',
  )

  assert.ok(fartherMove)
  assert.ok(nearerMove)
  assert.ok(rule?.compare)

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
    const transformedMoves = getChess(transformedFen).moves({ verbose: true })
    const transformedFarther = transformedMoves.find(
      ({ from, to }) =>
        from === transformSquare(fartherMove.from, transform) &&
        to === transformSquare(fartherMove.to, transform),
    )
    const transformedNearer = transformedMoves.find(
      ({ from, to }) =>
        from === transformSquare(nearerMove.from, transform) &&
        to === transformSquare(nearerMove.to, transform),
    )

    assert.ok(transformedFarther, transform.name)
    assert.ok(transformedNearer, transform.name)
    assert.ok(
      rule.compare(
        scoreTwoBishopsWhiteMove(
          transformedFen,
          transformedFarther.san,
        ),
        scoreTwoBishopsWhiteMove(
          transformedFen,
          transformedNearer.san,
        ),
      ) < 0,
      transform.name,
    )
  }
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
