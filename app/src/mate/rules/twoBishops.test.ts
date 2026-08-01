import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  SQUARE_TRANSFORMS,
  getChess,
  getEndgamePiecePlacements,
  transformFen,
} from '../chess'
import {
  compareTwoBishopsBlackScores,
  getMateRuleSet,
  scoreTwoBishopsBlackMove,
  scoreTwoBishopsWhiteMove,
  twoBishopsWhiteRules,
} from './index'
import {
  getBlackKingReachableArea,
  getWhiteKingBishopScreeningPenalty,
} from './twoBishopsGeometry'
import { selectIdealMoves } from './selection'
import {
  TWO_BISHOPS_DIAGRAM_CENSUS,
  TWO_BISHOPS_DIAGRAM_POSITIONS,
} from './twoBishopsDiagramPositions'

const WHITE_RULE_IDS = [
  'mate',
  'bishops safe',
  'no stalemate',
  'edge finish',
  'form wall',
  'push with king',
  'advance wall',
  'waiting move',
] as const

test('Two Bishops exposes concise position-only teaching rules', () => {
  assert.deepEqual(
    twoBishopsWhiteRules.map(({ id }) => id),
    WHITE_RULE_IDS,
  )
  for (const rule of twoBishopsWhiteRules.slice(3)) {
    assert.ok(rule.helpText.length > 0, `${rule.id} needs an explanation`)
    assert.ok(rule.helpText.length < 240, `${rule.id} is too verbose`)
  }
  assert.deepEqual(
    twoBishopsWhiteRules.slice(3).map(({ id, helpText }) => ({
      id,
      helpText,
    })),
    [
      {
        id: 'edge finish',
        helpText:
          'Phase 2: edge to corner. King set: drive; else seal closer. One step: clear support in cage; keep edge, avoid old wall, nearer; then king/replies/matching bishop. Drive/wall toward Black. Stuck: wait with replies. Corner: opposite bishop.',
      },
      {
        id: 'form wall',
        helpText:
          'Phase 1: first make the bishops side by side without screening one. Prefer a safe quiet wall with fewer bishops on the board edge, then give Black the smaller reachable region.',
      },
      {
        id: 'push with king',
        helpText:
          'With the wall fixed, move White’s king without screening a bishop. Prefer a move that forces every Black reply farther from the wall; while building the wall, bring the king closer.',
      },
      {
        id: 'advance wall',
        helpText:
          'When the king cannot push Black farther, advance the side-by-side wall. A two-move advance must survive every reply. Prefer fewer edge bishops, then a smaller region. Exact tie: move the bishop opposite Black’s color.',
      },
      {
        id: 'waiting move',
        helpText:
          'Only when the wall cannot be formed, the king cannot progress, and the wall cannot advance, make a safe quiet bishop wait that preserves the cage and stays off the edge.',
      },
    ],
  )
  assert.deepEqual(
    getMateRuleSet('two-bishops').whiteRuleDescriptions.map(({ id }) => id),
    WHITE_RULE_IDS,
  )
})

test('Two Bishops diagrams use verifier-derived rule-relevant positions', () => {
  assert.equal(TWO_BISHOPS_DIAGRAM_CENSUS.roots, 5_000)
  assert.equal(TWO_BISHOPS_DIAGRAM_CENSUS.expandedPositions, 29_857)
  assert.equal(TWO_BISHOPS_DIAGRAM_CENSUS.canonicalPositions, 29_857)
  assert.equal(TWO_BISHOPS_DIAGRAM_CENSUS.observations, 246_395)

  const ruleSet = getMateRuleSet('two-bishops')
  for (const [id, generated] of [
    ['bishop-corner-finish', TWO_BISHOPS_DIAGRAM_POSITIONS.cornerFinish],
  ] as const) {
    const board = ruleSet.help.noteBoards.find((candidate) => candidate.id === id)
    assert.ok(board)
    assert.doesNotThrow(() => getChess(generated.fen))
    assert.equal(ruleSet.currentWhiteHint(generated.fen)?.id, generated.ruleId)
    assert.ok(generated.observations >= 100)
    assert.deepEqual(
      board.pieces,
      getEndgamePiecePlacements(generated.fen).map(
        ({ color, square, type }) => ({
          square,
          piece: color === 'w' ? type.toUpperCase() : type,
        }),
      ),
    )
    assert.deepEqual(board.layout, { files: 8, ranks: 8, fileOffset: 0 })
    assert.deepEqual(board.highlights, [])
  }
})

test('corner check selects the forcing check among certified moves', () => {
  const fen = '8/8/8/1B6/8/8/2K5/k1B5 w - - 14 8'
  const chess = getChess(fen)
  const humanMoves = selectIdealMoves(
    chess.moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    })),
    twoBishopsWhiteRules,
  )

  assert.deepEqual(humanMoves, ['Bb2+'])
  assert.equal(
    getMateRuleSet('two-bishops').currentWhiteHint(fen)?.id,
    'edge finish',
  )
})

test('Two Bishops uses the edge transition when the king can seal it', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const fen = '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1'
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Be7'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge finish')
})

test('the visible Two Bishops policy repairs the former four-ply cycle', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const startingFen = '6k1/8/6BK/8/8/8/8/2B5 w - - 0 1'
  const chess = getChess(startingFen)
  assert.deepEqual(ruleSet.idealWhiteMoves(chess.fen()), ['Ba3'])
  assert.equal(ruleSet.idealWhiteMoves(chess.fen()).includes('Bg5'), false)
})

test('production scores contain no proof-distance selector', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  for (const fen of [
    '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1',
    '8/3B3k/5K1B/8/8/8/8/8 w - - 2 2',
    '8/8/2B5/8/8/2K5/8/1kB5 w - - 0 1',
    '8/8/8/1B6/8/B1K5/k7/8 w - - 0 1',
    '8/8/8/2BB4/8/K2k4/8/8 w - - 0 1',
  ]) {
    const moves = ruleSet.idealWhiteMoves(fen)
    assert.ok(moves.length > 0)
    for (const san of moves) {
      const score = scoreTwoBishopsWhiteMove(fen, san)
      assert.equal('proofProgressPenalty' in score, false)
      assert.equal('proofWorstReplyDistance' in score, false)
    }
  }
})

test('two-bishop recommendations are symmetric', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const fen = '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1'
  const expectedCount = ruleSet.idealWhiteMoves(fen).length
  for (const transform of SQUARE_TRANSFORMS) {
    const transformed = getChess(transformFen(fen, transform)).fen()
    assert.equal(ruleSet.idealWhiteMoves(transformed).length, expectedCount)
  }
})

test('White recommendations depend only on the board position', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const fresh = '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1'
  const old = '5Bk1/3B4/5K2/8/8/8/8/8 w - - 76 39'
  assert.deepEqual(ruleSet.idealWhiteMoves(fresh), ['Be7'])
  assert.deepEqual(ruleSet.idealWhiteMoves(old), ['Be7'])
  assert.equal(
    ruleSet.currentWhiteHint(fresh)?.id,
    ruleSet.currentWhiteHint(old)?.id,
  )
})

test('bishop screening counts only White king between Black and a bishop', () => {
  assert.equal(
    getWhiteKingBishopScreeningPenalty(
      '8/8/8/2B5/3K4/4k3/6B1/8 b - - 0 1',
    ),
    1,
  )
  assert.equal(
    getWhiteKingBishopScreeningPenalty(
      '8/8/8/2B5/8/4k3/6B1/3K4 b - - 0 1',
    ),
    0,
  )
})

test('coordinated bishops leave Black less room', () => {
  const scattered = getBlackKingReachableArea(
    '8/8/8/2B5/8/K2k4/8/6B1 w - - 0 1',
  )
  const wall = getBlackKingReachableArea(
    '8/8/8/2BB4/8/K2k4/8/8 w - - 0 1',
  )
  assert.ok(wall < scattered)
})

test('waiting fallback actually requires a bishop move', () => {
  const fen = '2k5/8/2BBK3/8/8/8/8/8 w - - 0 1'
  const bishopMove = scoreTwoBishopsWhiteMove(fen, 'Bd5')
  const kingMove = scoreTwoBishopsWhiteMove(fen, 'Kd5')
  assert.equal(bishopMove.tempoMovePenalty, 0)
  assert.equal(kingMove.tempoMovePenalty, 1)
})

test('advance wall starts with Bc2 from the required position', () => {
  const fen = '8/8/8/8/8/8/4K3/3BB1k1 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.equal(ruleSet.phase(fen), '1/2')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bc2'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'advance wall')
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bc2').waitingColorLockPenalty, 0)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bh4').waitingColorLockPenalty, 1)
})

test('after Bc2 Kg2, the light-squared bishop tightens the wall', () => {
  const fen = '8/8/8/8/8/8/2B1K1k1/4B3 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bd2'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'form wall')
})

test('form wall rejects Bb2 in favor of the tighter Bc2 wall', () => {
  const fen = '8/8/8/8/8/1KB5/4k3/1B6 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bc2'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'form wall')
})

test('form wall does not put the king between Black and a bishop', () => {
  const fen = '8/7k/8/4BK2/8/5B2/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const idealMoves = ruleSet.idealWhiteMoves(fen)
  assert.ok(!idealMoves.includes('Be4'))
  assert.ok(idealMoves.length > 0)
  for (const san of idealMoves) {
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, san)
        .kingBishopScreeningPenalty,
      0,
    )
  }
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'form wall')
})

test('fixed wall uses Kc3 to force every reply farther away', () => {
  const fen = '8/8/8/8/8/1K6/1B6/1B1k4 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kc3'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'push with king')
})

test('edge finish keeps the cage sealed while the king improves', () => {
  const fen = '6k1/8/4KBB1/8/8/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const idealMoves = ruleSet.idealWhiteMoves(fen)
  assert.ok(idealMoves.length > 0)
  for (const san of idealMoves) {
    const score = scoreTwoBishopsWhiteMove(fen, san)
    assert.equal(score.bishopSafetyPenalty, 0)
    assert.equal(score.stalematePenalty, 0)
    assert.equal(score.edgeSealPenalty, 0)
    assert.equal(score.holdEdgePenalty, 0)
    assert.equal(score.bishopAdjacencyPenalty, 0)
    assert.equal(score.blackKingReachableArea, 2)
    assert.equal(score.worstReplyKingDistance, 2)
  }
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge finish')
})

test('edge finish seals the edge with the king before continuing', () => {
  const fen = '4BB2/4K2k/8/8/8/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kf7'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge finish')
})

test('edge finish drives with a bishop after the king is set', () => {
  const beforeSeal = '8/8/6B1/6B1/8/5K2/7k/8 w - - 0 1'
  const afterSeal = '8/8/6B1/6B1/8/7k/5K2/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(ruleSet.idealWhiteMoves(beforeSeal), ['Kf2'])
  assert.deepEqual(ruleSet.idealWhiteMoves(afterSeal), ['Bh5'])
  assert.equal(ruleSet.currentWhiteHint(afterSeal)?.id, 'edge finish')
})

test('edge finish advances an existing wall before resetting the king', () => {
  const fen = '6k1/8/5K2/4B3/4B3/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bf5'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge finish')
})

test('mid-edge waiting does not loosen the cage', () => {
  const fen = '8/8/8/5B1k/5B2/5K2/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const moves = ruleSet.idealWhiteMoves(fen)
  assert.equal(moves.includes('Be4'), false)
  assert.ok(moves.length > 0)
  for (const san of moves) {
    assert.equal(scoreTwoBishopsWhiteMove(fen, san).tempoAreaPenalty, 0)
  }
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge finish')
})

test('edge finish approaches a support square, not the corner itself', () => {
  const fen = '8/8/8/5B2/5B1k/8/6K1/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const moves = ruleSet.idealWhiteMoves(fen)
  assert.equal(moves.includes('Kh1'), false)
  assert.ok(moves.length > 0)
  const bestSupportDistance = Math.min(
    ...getChess(fen)
      .moves()
      .map((san) => scoreTwoBishopsWhiteMove(fen, san))
      .filter(
        (score) =>
          score.holdEdgePenalty === 0 &&
          score.wallMovePenalty === 0 &&
          score.blackKingReachableArea === 2,
      )
      .map((score) => score.cornerSupportDistance),
  )
  for (const san of moves) {
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, san).cornerSupportDistance,
      bestSupportDistance,
    )
  }
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge finish')
})

test('a forced corner drive outranks restoring the previous wall', () => {
  const fen = '8/8/8/8/4BB1k/5K2/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const idealMoves = ruleSet.idealWhiteMoves(fen)
  assert.ok(!idealMoves.includes('Bf5'))
  for (const san of idealMoves) {
    const score = scoreTwoBishopsWhiteMove(fen, san)
    assert.equal(score.bishopSafetyPenalty, 0)
    assert.equal(score.stalematePenalty, 0)
    assert.equal(score.holdEdgePenalty, 0)
    assert.equal(score.tempoMovePenalty, 0)
    assert.equal(score.cornerDriveDistance, 2)
  }
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge finish')
})

test('a directed wall advance outranks breaking the wall for a drive', () => {
  const fen = '8/8/7k/3BBK2/8/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const idealMoves = ruleSet.idealWhiteMoves(fen)
  assert.ok(!idealMoves.includes('Bf3'))
  assert.ok(idealMoves.length > 0)
  for (const san of idealMoves) {
    const score = scoreTwoBishopsWhiteMove(fen, san)
    assert.equal(score.wallMovePenalty, 0)
    assert.equal(score.tempoTowardBlackPenalty, 0)
    assert.equal(score.bishopAdjacencyPenalty, 0)
  }
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge finish')
})

test('an edge-confined dead end waits with a bishop, not the king', () => {
  const fen = '8/5B1k/5B2/5K2/8/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const idealMoves = ruleSet.idealWhiteMoves(fen)
  assert.ok(!idealMoves.includes('Kg4'))
  assert.ok(!idealMoves.includes('Kf4'))
  assert.ok(idealMoves.length > 0)
  for (const san of idealMoves) {
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, san).waitingMovePenalty,
      0,
    )
  }
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge finish')
})

test('a seal that cannot improve corner support becomes a wait', () => {
  const fen = '8/8/7k/5K2/8/6B1/6B1/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const idealMoves = ruleSet.idealWhiteMoves(fen)
  assert.ok(!idealMoves.includes('Kf6'))
  assert.ok(idealMoves.length > 0)
  for (const san of idealMoves) {
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, san).waitingMovePenalty,
      0,
    )
  }
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge finish')
})

test('an equal corner drive moves the bishop toward Black', () => {
  const fen = '6k1/8/5K2/8/5B2/8/6B1/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const idealMoves = ruleSet.idealWhiteMoves(fen)
  assert.ok(!idealMoves.includes('Bd6'))
  assert.ok(idealMoves.length > 0)
  for (const san of idealMoves) {
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, san).tempoTowardBlackPenalty,
      0,
    )
  }
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge finish')
})

test('one step from the corner lets Black turn onto either edge', () => {
  const fen = '8/8/8/8/4B3/5K2/3B3k/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const idealMoves = ruleSet.idealWhiteMoves(fen)
  assert.ok(!idealMoves.includes('Kf2'))
  assert.ok(idealMoves.length > 0)
  for (const san of idealMoves) {
    const score = scoreTwoBishopsWhiteMove(fen, san)
    assert.equal(score.bishopSafetyPenalty, 0)
    assert.equal(score.stalematePenalty, 0)
    assert.equal(score.cornerTurnEdgePenalty, 0)
    assert.equal(score.cornerDriveDistance, 1)
  }
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge finish')
})

test('corner turn avoids a forced bishop shuttle', () => {
  const fen = '8/8/8/8/7B/5K1B/7k/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const idealMoves = ruleSet.idealWhiteMoves(fen)
  assert.ok(!idealMoves.includes('Bg2'))
  assert.ok(idealMoves.length > 0)
  for (const san of idealMoves) {
    const score = scoreTwoBishopsWhiteMove(fen, san)
    assert.equal(score.cornerTurnEdgePenalty, 0)
    assert.equal(score.cornerDriveDistance, 1)
    assert.equal(score.blackReplyCount, 2)
  }
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge finish')
})

test('corner turn keeps the king support squares clear', () => {
  const fen = '8/8/8/8/8/8/4K3/4BBk1 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.equal(ruleSet.phase(fen), '2/2')
  const idealMoves = ruleSet.idealWhiteMoves(fen)
  assert.ok(!idealMoves.includes('Bg3'))
  assert.ok(idealMoves.length > 0)
  for (const san of idealMoves) {
    const score = scoreTwoBishopsWhiteMove(fen, san)
    assert.equal(score.cornerSupportBlockers, 0)
    assert.equal(score.cornerTurnEdgePenalty, 0)
    assert.equal(score.cornerDriveDistance, 1)
    assert.equal(score.blackReplyCount, 2)
  }
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge finish')
})

test('with king set beside the corner, the opposite bishop waits', () => {
  const fen = '4BB1k/5K2/8/8/8/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bd7'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'edge finish')
})

test('Black captures before seeking the center or a bishop', () => {
  const fen = '6B1/8/8/8/3k4/2B5/8/K7 b - - 0 1'
  const capture = scoreTwoBishopsBlackMove(fen, 'Kxc3')
  const quiet = scoreTwoBishopsBlackMove(fen, 'Ke4')
  assert.ok(compareTwoBishopsBlackScores(capture, quiet) < 0)
})

test('Black resistance and every White selector stay explicit', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const help = ruleSet.help
  assert.deepEqual(help.blackPriorities, [
    "Take a piece if White isn't looking.",
    'Move toward the center.',
    'Move toward an unprotected bishop.',
  ])
  assert.equal(
    ruleSet.whiteRuleDescriptions.some(
      ({ presentationRole }) => presentationRole === 'guard',
    ),
    false,
  )
  const source = readFileSync(new URL('./twoBishops.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(
    source,
    /twoBishopsProof|getTwoBishopsProofDistance|completionGuard|previousTurnFen|getEndgameReturnToPositionMoves|presentationRole\s*:\s*['"]internal/,
  )
})
