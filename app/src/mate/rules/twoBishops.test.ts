import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { Chess, type Move, type Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  kingDistance,
  transformFen,
  transformSquare,
  validateMatePosition,
} from '../chess'
import {
  compareTwoBishopsBlackScores,
  compareTwoBishopsWhiteScores,
  getMateRuleSet,
  getProximateBishopWall,
  getTwoBishopsDegenerateReasonLabel,
  getTwoBishopsMatingPositionSquares,
  getTwoBishopsPhaseLabel,
  isTwoBishopsPhaseTwoPosition,
  scoreTwoBishopsBlackMove,
  scoreTwoBishopsWhiteMove,
  TWO_BISHOPS_DEGENERATE_PRIORITY_ORDER,
  twoBishopsRuleSet,
  twoBishopsWhiteRules,
} from './index'
import { TWO_BISHOPS_DIAGRAM_POSITIONS } from './twoBishopsDiagramPositions'

const WHITE_RULE_IDS = [
  'mate',
  'bishops safe',
  'no stalemate',
  'mate in 3',
  'degenerate',
  'force phase 2',
  'shepherd',
  'sequester',
  'bishops off edge',
  'phase 2 wall',
  'rule z',
  'rule y',
  'rule x',
  'rule w',
  'rule v',
  'rule u',
  'unclutter bishops',
  'king closer',
  'check',
] as const

type UniversalOutcome = {
  readonly san: string
  readonly mate: boolean
  readonly bishopCanBeCaptured: boolean
  readonly stalemate: boolean
}

function universalOutcomes(fen: string): UniversalOutcome[] {
  return getChess(fen).moves().map((san) => {
    const chess = getChess(fen)
    chess.move(san)
    const mate = chess.isCheckmate()
    return {
      san,
      mate,
      bishopCanBeCaptured: chess
        .moves({ verbose: true })
        .some((reply) => reply.captured === 'b'),
      stalemate: !mate && chess.isStalemate(),
    }
  })
}

function expectedUniversalSurvivors(fen: string): string[] {
  let survivors = universalOutcomes(fen)
  if (survivors.some(({ mate }) => mate)) {
    return survivors.filter(({ mate }) => mate).map(({ san }) => san)
  }
  if (survivors.some(({ bishopCanBeCaptured }) => !bishopCanBeCaptured)) {
    survivors = survivors.filter(
      ({ bishopCanBeCaptured }) => !bishopCanBeCaptured,
    )
  }
  if (survivors.some(({ stalemate }) => !stalemate)) {
    survivors = survivors.filter(({ stalemate }) => !stalemate)
  }
  return survivors.map(({ san }) => san)
}

function expectedAfterSequester(fen: string, moves: string[]): string[] {
  if (
    !moves.some((san) => scoreTwoBishopsWhiteMove(fen, san).sequesterApplies)
  ) {
    return moves
  }
  const bestTargetScore = Math.max(
    ...moves.map(
      (san) =>
        scoreTwoBishopsWhiteMove(fen, san).sequesterTargetCornerScore,
    ),
  )
  const bestTargetMoves = moves.filter(
    (san) =>
      scoreTwoBishopsWhiteMove(fen, san).sequesterTargetCornerScore ===
      bestTargetScore,
  )
  const bestProgress = Math.min(
    ...bestTargetMoves.map((san) => {
      const score = scoreTwoBishopsWhiteMove(fen, san)
      return (
        score.sequesterMaximumCornerReplyDistance -
        score.sequesterCurrentCornerDistance
      )
    }),
  )
  const blackProgressMoves = bestTargetMoves.filter((san) => {
    const score = scoreTwoBishopsWhiteMove(fen, san)
    return (
      score.sequesterMaximumCornerReplyDistance -
        score.sequesterCurrentCornerDistance ===
      bestProgress
    )
  })
  const afterEdgeControl =
    bestProgress < 0
      ? blackProgressMoves
      : (() => {
          const bestEdgeControl = Math.min(
            ...blackProgressMoves.map(
              (san) =>
                scoreTwoBishopsWhiteMove(fen, san)
                  .sequesterTwoAwayControlPenalty,
            ),
          )
          return blackProgressMoves.filter(
            (san) =>
              scoreTwoBishopsWhiteMove(fen, san)
                .sequesterTwoAwayControlPenalty === bestEdgeControl,
          )
        })()
  const bestReplyDistance = Math.min(
    ...afterEdgeControl.map(
      (san) =>
        scoreTwoBishopsWhiteMove(fen, san)
          .sequesterMaximumCornerReplyDistance,
    ),
  )
  return afterEdgeControl.filter(
    (san) =>
      scoreTwoBishopsWhiteMove(fen, san)
        .sequesterMaximumCornerReplyDistance === bestReplyDistance,
  )
}

function expectedAfterBishopsOffEdge(
  fen: string,
  moves: string[],
): string[] {
  if (
    !moves.every(
      (san) => scoreTwoBishopsWhiteMove(fen, san).isPhaseTwoPosition,
    )
  ) {
    return moves
  }
  const bestCount = Math.min(
    ...moves.map(
      (san) => scoreTwoBishopsWhiteMove(fen, san).bishopsOnBlackEdgeCount,
    ),
  )
  return moves.filter(
    (san) =>
      scoreTwoBishopsWhiteMove(fen, san).bishopsOnBlackEdgeCount ===
      bestCount,
  )
}

function expectedAfterForcePhaseTwo(fen: string, moves: string[]): string[] {
  if (
    !moves.some(
      (san) => scoreTwoBishopsWhiteMove(fen, san).forcePhaseTwoApplies,
    )
  ) {
    return moves
  }
  const forcingMoves = moves.filter(
    (san) => scoreTwoBishopsWhiteMove(fen, san).forcePhaseTwoPenalty === 0,
  )
  return forcingMoves.length > 0 ? forcingMoves : moves
}

function expectedAfterShepherd(fen: string, moves: string[]): string[] {
  if (
    !moves.some(
      (san) => scoreTwoBishopsWhiteMove(fen, san).shepherdApplies,
    )
  ) {
    return moves
  }
  const shepherdMoves = moves.filter(
    (san) => scoreTwoBishopsWhiteMove(fen, san).shepherdPenalty === 0,
  )
  return shepherdMoves.length > 0 ? shepherdMoves : moves
}

function expectedAfterPhaseTwoWall(fen: string, moves: string[]): string[] {
  if (
    !moves.some((san) => scoreTwoBishopsWhiteMove(fen, san).phaseTwoWallApplies)
  ) {
    return moves
  }
  const bestWallPenalty = Math.min(
    ...moves.map(
      (san) => scoreTwoBishopsWhiteMove(fen, san).phaseTwoWallPenalty,
    ),
  )
  const wallMoves = moves.filter(
    (san) =>
      scoreTwoBishopsWhiteMove(fen, san).phaseTwoWallPenalty ===
      bestWallPenalty,
  )
  return wallMoves
}

function expectedAfterMateInThree(fen: string, moves: string[]): string[] {
  if (
    !moves.some((san) => scoreTwoBishopsWhiteMove(fen, san).mateInThreeApplies)
  ) {
    return moves
  }
  const bestTurns = Math.min(
    ...moves.map(
      (san) => scoreTwoBishopsWhiteMove(fen, san).mateInThreeTurns,
    ),
  )
  return bestTurns < 99
    ? moves.filter(
        (san) =>
          scoreTwoBishopsWhiteMove(fen, san).mateInThreeTurns === bestTurns,
      )
    : moves
}

function expectedAfterDegenerate(fen: string, moves: string[]): string[] {
  if (
    !moves.some((san) => scoreTwoBishopsWhiteMove(fen, san).degenerateApplies)
  ) {
    return moves
  }
  const freeingMoves = moves.filter(
    (san) => scoreTwoBishopsWhiteMove(fen, san).degeneratePenalty === 0,
  )
  return freeingMoves.length > 0 ? freeingMoves : moves
}

function edgeRepairFen(
  blackKing: Square,
  controllingBishop: Square,
): string {
  const chess = new Chess()
  chess.clear()
  assert.equal(chess.put({ color: 'w', type: 'k' }, 'f2'), true)
  assert.equal(chess.put({ color: 'b', type: 'k' }, blackKing), true)
  assert.equal(chess.put({ color: 'w', type: 'b' }, 'e1'), true)
  assert.equal(
    chess.put({ color: 'w', type: 'b' }, controllingBishop),
    true,
  )
  return chess.fen()
}

function kingLiftFen(
  blackKing: 'g1' | 'h1' = 'g1',
  diagonalBishop: Square = 'd2',
  otherBishop: Square = 'f5',
  whiteKing: Square = 'f3',
): string {
  const chess = new Chess()
  chess.clear()
  assert.equal(chess.put({ color: 'w', type: 'k' }, whiteKing), true)
  assert.equal(chess.put({ color: 'b', type: 'k' }, blackKing), true)
  assert.equal(
    chess.put({ color: 'w', type: 'b' }, diagonalBishop),
    true,
  )
  assert.equal(chess.put({ color: 'w', type: 'b' }, otherBishop), true)
  return chess.fen()
}

test('Two Bishops exposes each Phase 2 comparison as one visible rule', () => {
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
        shortLabel: 'mate in 3',
        helpText:
          "With Black's king in the corner and White's king in a mating position, play mate in 3.",
      },
      {
        shortLabel: 'degenerate',
        helpText: 'repair degenerate positions',
      },
      {
        shortLabel: 'force phase 2',
        helpText: '(see notes)',
      },
      {
        shortLabel: 'shepherd',
        helpText:
          "Phase 2: When a bishop controls the edge square 2 away from Black's king and further from the target square, take opposition, moving towards the target corner.",
      },
      {
        shortLabel: 'sequester',
        helpText:
          "Phase 2: Force Black's king towards the target corner, or otherwise use a bishop to control the square 2 away from Black's current square.",
      },
      {
        shortLabel: 'bishops off edge',
        helpText: "Phase 2: Prefer fewer bishops on Black's edge.",
      },
      {
        shortLabel: 'phase 2 wall',
        helpText:
          "Phase 2: Create or maintain a 2 square wall adjacent to Black's king and opposite the target corner.",
      },
      {
        shortLabel: 'rule z',
        helpText:
          'Phase 1: Control the target square with a bishop without checking, unless following rule v.',
      },
      {
        shortLabel: 'rule y',
        helpText:
          "Phase 1: Use a bishop to control the two squares adjacent to Black's king and also the target square.",
      },
      {
        shortLabel: 'rule x',
        helpText:
          'Phase 1: Prefer moving an attacked bishop as far as possible.',
      },
      {
        shortLabel: 'rule w',
        helpText: 'Phase 1: Move the king towards the target square.',
      },
      {
        shortLabel: 'rule v',
        helpText:
          'Phase 1: If the king already controls the target square, check the king, from not the target square.',
      },
      {
        shortLabel: 'rule u',
        helpText:
          "Phase 1: Prefer bishops further from Black's king, and not on an edge.",
      },
      {
        shortLabel: 'unclutter bishops',
        helpText:
          'Phase 2: Prefer bishops more than two king steps from a corner.',
      },
      {
        shortLabel: 'king closer',
        helpText:
          "Bring White's king closer to Black's king, preferring proximity to the the middle 16 squares.",
      },
      {
        shortLabel: 'check',
        helpText: 'Play a check',
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
      rule.id === 'mate in 3' ||
      rule.id === 'degenerate' ||
      rule.id === 'force phase 2' ||
      rule.id === 'shepherd' ||
      rule.id === 'check'
    ) {
      assert.equal(typeof rule.applies, 'function')
      assert.equal(typeof rule.compare, 'function')
      assert.equal(rule.subpriorities, undefined)
      if (rule.id === 'degenerate') {
        assert.equal(typeof rule.stopWhenBest, 'function')
      }
    } else if (rule.id === 'sequester') {
      assert.equal(typeof rule.applies, 'function')
      assert.equal(rule.compare, undefined)
      assert.equal(rule.subpriorities?.length, 4)
    } else if (rule.id === 'bishops off edge') {
      assert.equal(typeof rule.applies, 'function')
      assert.equal(typeof rule.compare, 'function')
      assert.equal(rule.subpriorities, undefined)
    } else if (
      rule.id === 'rule z' ||
      rule.id === 'rule y' ||
      rule.id === 'rule x' ||
      rule.id === 'rule w'
    ) {
      assert.equal(typeof rule.applies, 'function')
      assert.equal(rule.compare, undefined)
      assert.equal(rule.subpriorities?.length, 1)
      assert.equal(typeof rule.subpriorities[0]?.when, 'function')
      if (rule.id === 'rule x') {
        assert.equal(typeof rule.subpriorities[0]?.rank, 'function')
      } else {
        assert.equal(typeof rule.subpriorities[0]?.compare, 'function')
      }
    } else if (rule.id === 'rule v' || rule.id === 'rule u') {
      assert.equal(typeof rule.applies, 'function')
      assert.equal(typeof rule.compare, 'function')
      assert.equal(rule.subpriorities, undefined)
    } else if (
      rule.id === 'phase 2 wall' ||
      rule.id === 'unclutter bishops'
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

test('the visible strategic comparisons run in their displayed order', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const positions = [
    '8/8/8/8/8/1KB5/4k3/1B6 w - - 0 1',
    '8/8/8/8/8/8/4K3/3BB1k1 w - - 0 1',
    '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1',
    '8/8/8/1B6/8/8/2K5/k1B5 w - - 14 8',
    '8/8/7k/5K2/8/6B1/6B1/8 w - - 0 1',
  ]

  for (const fen of positions) {
    const expected = expectedUniversalSurvivors(fen)
    const afterMateInThree = expectedAfterMateInThree(fen, expected)
    const afterDegenerate = expectedAfterDegenerate(fen, afterMateInThree)
    const afterForcePhaseTwo = expectedAfterForcePhaseTwo(
      fen,
      afterDegenerate,
    )
    const afterShepherd = expectedAfterShepherd(fen, afterForcePhaseTwo)
    const afterSequester = expectedAfterSequester(fen, afterShepherd)
    const afterBishopsOffEdge = expectedAfterBishopsOffEdge(
      fen,
      afterSequester,
    )
    const afterPhaseTwoWall = expectedAfterPhaseTwoWall(
      fen,
      afterBishopsOffEdge,
    )
    const phaseOneRulesApply = !afterPhaseTwoWall.some(
      (san) => scoreTwoBishopsWhiteMove(fen, san).isPhaseTwoPosition,
    )
    const targetBuildRulesApply =
      phaseOneRulesApply &&
      !afterPhaseTwoWall.some(
        (san) => {
          const score = scoreTwoBishopsWhiteMove(fen, san)
          return score.ruleVApplies && score.ruleVPenalty === 0
        },
      )
    const ruleZApplies = afterPhaseTwoWall.some(
      (san) => scoreTwoBishopsWhiteMove(fen, san).ruleZApplies,
    )
    const bestRuleZPenalty = Math.min(
      ...afterPhaseTwoWall.map(
        (san) => scoreTwoBishopsWhiteMove(fen, san).ruleZPenalty,
      ),
    )
    const afterRuleZ = ruleZApplies
      ? afterPhaseTwoWall.filter(
          (san) =>
            scoreTwoBishopsWhiteMove(fen, san).ruleZPenalty ===
            bestRuleZPenalty,
        )
      : afterPhaseTwoWall
    const bestRuleYControlledAdjacentCount = Math.max(
      ...afterRuleZ.map(
        (san) =>
          scoreTwoBishopsWhiteMove(fen, san)
            .ruleYControlledAdjacentCount,
      ),
    )
    const afterRuleY = targetBuildRulesApply
      ? afterRuleZ.filter(
          (san) =>
            scoreTwoBishopsWhiteMove(fen, san)
              .ruleYControlledAdjacentCount ===
            bestRuleYControlledAdjacentCount,
        )
      : afterRuleZ
    const ruleXMoves = afterRuleY.filter(
      (san) => scoreTwoBishopsWhiteMove(fen, san).ruleXApplies,
    )
    const bestRuleXTravelLength =
      ruleXMoves.length === 0
        ? 0
        : Math.max(
            ...ruleXMoves.map(
              (san) =>
                scoreTwoBishopsWhiteMove(fen, san).ruleXTravelLength,
            ),
          )
    const afterRuleX =
      targetBuildRulesApply && ruleXMoves.length > 0
        ? afterRuleY.filter(
            (san) =>
              scoreTwoBishopsWhiteMove(fen, san).ruleXApplies &&
              scoreTwoBishopsWhiteMove(fen, san).ruleXTravelLength ===
                bestRuleXTravelLength,
          )
        : afterRuleY
    const bestRuleWDistance = Math.min(
      ...afterRuleX.map(
        (san) => scoreTwoBishopsWhiteMove(fen, san).ruleWDistance,
      ),
    )
    const afterRuleW = targetBuildRulesApply
      ? afterRuleX.filter(
          (san) =>
            scoreTwoBishopsWhiteMove(fen, san).ruleWDistance ===
            bestRuleWDistance,
        )
      : afterRuleX
    const ruleVApplies = afterRuleW.some(
      (san) => scoreTwoBishopsWhiteMove(fen, san).ruleVApplies,
    )
    const bestRuleVPenalty = Math.min(
      ...afterRuleW.map(
        (san) => scoreTwoBishopsWhiteMove(fen, san).ruleVPenalty,
      ),
    )
    const afterRuleV = ruleVApplies
      ? afterRuleW.filter(
          (san) =>
            scoreTwoBishopsWhiteMove(fen, san).ruleVPenalty ===
            bestRuleVPenalty,
        )
      : afterRuleW
    const phaseOneRuleUCandidates = afterRuleV.filter(
      (san) => !scoreTwoBishopsWhiteMove(fen, san).isPhaseTwoPosition,
    )
    const bestRuleUScore = Math.max(
      0,
      ...phaseOneRuleUCandidates.map(
        (san) => scoreTwoBishopsWhiteMove(fen, san).ruleUScore,
      ),
    )
    const afterRuleU = afterRuleV.filter(
      (san) =>
        scoreTwoBishopsWhiteMove(fen, san).isPhaseTwoPosition ||
        scoreTwoBishopsWhiteMove(fen, san).ruleUScore === bestRuleUScore,
    )
    const phaseTwoUnclutterCandidates = afterRuleU.filter(
      (san) => scoreTwoBishopsWhiteMove(fen, san).isPhaseTwoPosition,
    )
    const bestClutteredBishopsCount = Math.min(
      ...phaseTwoUnclutterCandidates.map(
        (san) =>
          scoreTwoBishopsWhiteMove(fen, san).clutteredBishopsCount,
      ),
    )
    const afterUnclutterBishops = afterRuleU.filter(
      (san) =>
        !scoreTwoBishopsWhiteMove(fen, san).isPhaseTwoPosition ||
        scoreTwoBishopsWhiteMove(fen, san).clutteredBishopsCount ===
          bestClutteredBishopsCount,
    )
    const bestPhaseTwoLinePenalty = Math.min(
      ...afterUnclutterBishops.map(
        (san) =>
          scoreTwoBishopsWhiteMove(fen, san)
            .kingCloserPhaseTwoLinePenalty,
      ),
    )
    const preferredLineMoves = afterUnclutterBishops.filter(
      (san) =>
        scoreTwoBishopsWhiteMove(fen, san)
          .kingCloserPhaseTwoLinePenalty === bestPhaseTwoLinePenalty,
    )
    const bestKingCloserDistance = Math.min(
      ...preferredLineMoves.map(
        (san) => scoreTwoBishopsWhiteMove(fen, san).kingCloserDistance,
      ),
    )
    const closestKingMoves = preferredLineMoves.filter(
      (san) =>
        scoreTwoBishopsWhiteMove(fen, san).kingCloserDistance ===
        bestKingCloserDistance,
    )
    const bestMiddleSixteenDistance = Math.min(
      ...closestKingMoves.map(
        (san) =>
          scoreTwoBishopsWhiteMove(fen, san)
            .kingCloserMiddleSixteenDistance,
      ),
    )
    const afterKingCloser = closestKingMoves.filter(
      (san) =>
        scoreTwoBishopsWhiteMove(fen, san)
          .kingCloserMiddleSixteenDistance === bestMiddleSixteenDistance,
    )
    const checkingMoves = phaseOneRulesApply
      ? afterKingCloser.filter(
          (san) => scoreTwoBishopsWhiteMove(fen, san).checkPenalty === 0,
        )
      : []
    const expectedFinal =
      checkingMoves.length > 0 ? checkingMoves : afterKingCloser
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), expectedFinal, fen)
    for (const first of expectedFinal) {
      const firstScore = scoreTwoBishopsWhiteMove(fen, first)
      assert.deepEqual(
        Object.keys(firstScore).sort(),
        [
          'bishopSafetyPenalty',
          'bishopsOnBlackEdgeCount',
          'checkPenalty',
          'clutteredBishopsCount',
          'degenerateApplies',
          'degeneratePenalty',
          'degenerateTerminal',
          'forcePhaseTwoApplies',
          'forcePhaseTwoPenalty',
          'isPhaseTwoPosition',
          'kingCloserDistance',
          'kingCloserMiddleSixteenDistance',
          'kingCloserPhaseTwoLinePenalty',
          'mateInThreeApplies',
          'mateInThreeTurns',
          'matePenalty',
          'phaseTwoWallApplies',
          'phaseTwoWallPenalty',
          'ruleUScore',
          'ruleVApplies',
          'ruleVPenalty',
          'ruleWDistance',
          'ruleXApplies',
          'ruleXTravelLength',
          'ruleYControlledAdjacentCount',
          'ruleZApplies',
          'ruleZPenalty',
          'sequesterApplies',
          'sequesterCornerDiagonalsTarget',
          'sequesterCurrentCornerDistance',
          'sequesterHasTargetCorner',
          'sequesterIsBishopMove',
          'sequesterMaximumCornerReplyDistance',
          'sequesterTargetCornerScore',
          'sequesterTwoAwayControlPenalty',
          'shepherdApplies',
          'shepherdPenalty',
          'stalematePenalty',
        ],
        fen,
      )
      for (const second of expectedFinal) {
        assert.equal(
          compareTwoBishopsWhiteScores(
            firstScore,
            scoreTwoBishopsWhiteMove(fen, second),
          ),
          0,
          `${fen}: ${first} and ${second} must remain tied`,
        )
      }
    }
  }
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

test('Phase 1 target-square rules use the square opposite the nearest corner', () => {
  const fen = '8/8/5k2/8/8/2K5/B6B/8 w - - 0 1'
  const targetControl = scoreTwoBishopsWhiteMove(fen, 'Bg3')
  const targetOccupationCheck = scoreTwoBishopsWhiteMove(fen, 'Be5+')
  const ruleZ = twoBishopsWhiteRules.find(({ id }) => id === 'rule z')
  const ruleY = twoBishopsWhiteRules.find(({ id }) => id === 'rule y')

  assert.equal(targetControl.ruleZApplies, true)
  assert.equal(targetControl.ruleZPenalty, 0)
  assert.equal(targetOccupationCheck.ruleZPenalty, 1)
  assert.equal(targetControl.ruleYControlledAdjacentCount, 2)
  assert.equal(targetOccupationCheck.ruleYControlledAdjacentCount, 0)
  const ruleZPriority = ruleZ?.subpriorities?.[0]
  const ruleYPriority = ruleY?.subpriorities?.[0]
  assert.equal(ruleZPriority?.when?.([targetControl, targetOccupationCheck]), true)
  assert.ok(ruleZPriority?.compare)
  assert.ok(ruleZPriority.compare(targetControl, targetOccupationCheck) < 0)
  assert.equal(ruleYPriority?.when?.([targetControl, targetOccupationCheck]), true)
  assert.ok(ruleYPriority?.compare)
  assert.ok(ruleYPriority.compare(targetControl, targetOccupationCheck) < 0)

  const sourceMove = getChess(fen)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Bg3')
  assert.ok(sourceMove)
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
    const transformedMove: Move | undefined = getChess(transformedFen)
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
    assert.equal(transformedScore.ruleZPenalty, 0, transform.name)
    assert.equal(
      transformedScore.ruleYControlledAdjacentCount,
      2,
      transform.name,
    )
  }
})

test('rule x maximizes travel when an attacked bishop moves', () => {
  const fen = '8/8/5k2/5B2/8/2K5/8/B7 w - - 0 1'
  const near = scoreTwoBishopsWhiteMove(fen, 'Be6')
  const far = scoreTwoBishopsWhiteMove(fen, 'Bb1')
  const other = scoreTwoBishopsWhiteMove(fen, 'Kd4')
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule x')

  assert.equal(near.ruleXApplies, true)
  assert.equal(far.ruleXApplies, true)
  assert.equal(near.ruleXTravelLength, 1)
  assert.equal(far.ruleXTravelLength, 4)
  assert.equal(other.ruleXApplies, false)
  const priority = rule?.subpriorities?.[0]
  assert.equal(priority?.when?.([near, far, other]), true)
  assert.ok(priority?.rank)
  assert.deepEqual(priority.rank([near, far, other]), [1, 0, 1])
})

test('rule x makes the longest attacked-bishop move uniquely ideal', () => {
  const fen = '8/3Bk3/8/3K4/5B2/8/8/8 w - - 16 9'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bh3'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'rule x')
})

test('rule w moves White king toward the Phase 1 target square', () => {
  const fen = '8/8/5k2/8/8/2K5/B6B/8 w - - 0 1'
  const toward = scoreTwoBishopsWhiteMove(fen, 'Kd4')
  const away = scoreTwoBishopsWhiteMove(fen, 'Kb3')
  const wait = scoreTwoBishopsWhiteMove(fen, 'Bg3')
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule w')

  assert.equal(toward.ruleWDistance, 2)
  assert.equal(away.ruleWDistance, 13)
  assert.equal(wait.ruleWDistance, 8)
  const priority = rule?.subpriorities?.[0]
  assert.equal(priority?.when?.([toward, away, wait]), true)
  assert.ok(priority?.compare)
  assert.ok(priority.compare(toward, wait) < 0)
  assert.ok(priority.compare(wait, away) < 0)
})

test('rule v replaces rule z once White king controls the target', () => {
  const fen = '8/8/5k2/B7/3K4/8/B7/8 w - - 0 1'
  const checking = scoreTwoBishopsWhiteMove(fen, 'Bd8+')
  const quiet = scoreTwoBishopsWhiteMove(fen, 'Bb6')
  const ruleZ = twoBishopsWhiteRules.find(({ id }) => id === 'rule z')
  const ruleV = twoBishopsWhiteRules.find(({ id }) => id === 'rule v')

  assert.equal(checking.ruleZApplies, true)
  assert.equal(quiet.ruleZApplies, true)
  assert.equal(checking.ruleVApplies, true)
  assert.equal(checking.ruleVPenalty, 0)
  assert.equal(quiet.ruleVPenalty, 1)
  assert.equal(ruleZ?.applies?.(checking), true)
  assert.equal(ruleZ?.subpriorities?.[0]?.when?.([checking, quiet]), false)
  assert.ok(ruleV?.compare)
  assert.ok(ruleV.compare(checking, quiet) < 0)
  assert.deepEqual(getMateRuleSet('two-bishops').idealWhiteMoves(fen), [
    'Bd8+',
  ])
  assert.equal(getMateRuleSet('two-bishops').currentWhiteHint(fen)?.id, 'rule v')
})

test('rule u maximizes summed non-edge bishop distance from Black king', () => {
  const fen = '8/8/5k2/8/8/2K5/B6B/8 w - - 0 1'
  const edge = scoreTwoBishopsWhiteMove(fen, 'Kd4')
  const near = scoreTwoBishopsWhiteMove(fen, 'Bf4')
  const far = scoreTwoBishopsWhiteMove(fen, 'Bg3')
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule u')

  assert.equal(edge.ruleUScore, 0)
  assert.equal(near.ruleUScore, 2)
  assert.equal(far.ruleUScore, 3)
  assert.equal(rule?.applies?.(far), true)
  assert.ok(rule?.compare)
  assert.ok(rule.compare(far, near) < 0)
  assert.ok(rule.compare(near, edge) < 0)

  const phaseTwo = scoreTwoBishopsWhiteMove(
    '2k5/8/4K3/8/5B2/5B2/8/8 w - - 4 3',
    'Be4',
  )
  assert.equal(phaseTwo.isPhaseTwoPosition, true)
  assert.equal(rule.applies?.(phaseTwo), false)

  const sourceMove = getChess(fen).move('Bg3')
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
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, transformedMove.san)
        .ruleUScore,
      far.ruleUScore,
      transform.name,
    )
  }
})

test('rule z remains active when every rule-v check is unsafe', () => {
  const fen = '8/8/8/8/3KBk1B/8/8/8 w - - 22 12'
  const ruleSet = getMateRuleSet('two-bishops')
  const expected = scoreTwoBishopsWhiteMove(fen, 'Bf6')
  const unsafeCheck = scoreTwoBishopsWhiteMove(fen, 'Bg5+')
  const ruleZ = twoBishopsWhiteRules.find(({ id }) => id === 'rule z')

  assert.equal(expected.bishopSafetyPenalty, 0)
  assert.equal(expected.ruleZPenalty, 0)
  assert.equal(unsafeCheck.bishopSafetyPenalty, 1)
  assert.equal(unsafeCheck.ruleVPenalty, 0)
  assert.equal(ruleZ?.subpriorities?.[0]?.when?.([expected]), true)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bf6'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'rule z')
})

test('the Phase 1 target-square stack is inactive in Phase 2', () => {
  const score = scoreTwoBishopsWhiteMove(
    '8/8/8/5K1k/8/8/6BB/8 w - - 4 3',
    'Ke6',
  )
  assert.equal(score.isPhaseTwoPosition, true)
  for (const id of ['rule z', 'rule y', 'rule x', 'rule w', 'rule v']) {
    const rule = twoBishopsWhiteRules.find((candidate) => candidate.id === id)
    assert.equal(rule?.applies?.(score), false, id)
  }
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

test('king closer scores Phase 1 bishop moves after target-square rules', () => {
  const fen = '3K4/1k1B4/3B4/8/8/8/8/8 w - - 4 3'
  const bishopMove = scoreTwoBishopsWhiteMove(fen, 'Bc5')
  const kingMove = scoreTwoBishopsWhiteMove(fen, 'Ke7')
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(bishopMove.kingCloserDistance, 5)
  assert.equal(bishopMove.kingCloserMiddleSixteenDistance, 2)
  assert.equal(kingMove.kingCloserDistance, 9)
  const kingCloser = twoBishopsWhiteRules.find(({ id }) => id === 'king closer')
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

  assert.equal(isTwoBishopsPhaseTwoPosition(fen), true)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kf2').kingCloserDistance, 5)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Ke2').kingCloserDistance, 10)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bc8').kingCloserDistance, 8)
})

test('check prefers a checking move between otherwise tied Phase 1 candidates', () => {
  const fen = '8/2B5/8/3k4/8/3K4/8/1B6 w - - 0 1'
  const checking = scoreTwoBishopsWhiteMove(fen, 'Ba2+')
  const quiet = scoreTwoBishopsWhiteMove(fen, 'Bc2')
  const check = twoBishopsWhiteRules.find(({ id }) => id === 'check')

  assert.equal(checking.kingCloserDistance, quiet.kingCloserDistance)
  assert.equal(checking.kingCloserMiddleSixteenDistance, quiet.kingCloserMiddleSixteenDistance)
  assert.equal(checking.checkPenalty, 0)
  assert.equal(quiet.checkPenalty, 1)
  assert.ok(check?.compare)
  assert.ok(check.compare(checking, quiet) < 0)
})

test('check leaves Phase 1 survivors tied when none gives check', () => {
  const fen = '8/5k2/8/2B3K1/4B3/8/8/8 w - - 4 3'
  const check = twoBishopsWhiteRules.find(({ id }) => id === 'check')
  const first = scoreTwoBishopsWhiteMove(fen, 'Bd4')
  const second = scoreTwoBishopsWhiteMove(fen, 'Bc6')

  assert.equal(first.checkPenalty, 1)
  assert.equal(second.checkPenalty, 1)
  assert.ok(check?.compare)
  assert.equal(check.compare(first, second), 0)
})

test('check is inactive in Phase 2', () => {
  const fen = '8/8/7k/5K2/8/6B1/6B1/8 w - - 0 1'
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'check')

  assert.ok(rule)
  assert.equal(
    rule.applies?.(scoreTwoBishopsWhiteMove(fen, 'Bf4+')),
    false,
  )
  assert.equal(
    rule.applies?.(scoreTwoBishopsWhiteMove(fen, 'Be5')),
    false,
  )
})

test('unclutter bishops prefers fewer bishops within two king steps of a corner', () => {
  const fen = '8/7k/8/4B3/8/2B5/8/K7 w - - 0 1'
  const unclutter = twoBishopsWhiteRules.find(
    ({ id }) => id === 'unclutter bishops',
  )
  const clear = scoreTwoBishopsWhiteMove(fen, 'Bb4')
  const cluttered = scoreTwoBishopsWhiteMove(fen, 'Bb2')

  assert.equal(clear.clutteredBishopsCount, 0)
  assert.equal(cluttered.clutteredBishopsCount, 1)
  assert.ok(unclutter?.compare)
  assert.equal(clear.isPhaseTwoPosition, false)
  assert.equal(unclutter.applies?.(clear), false)
  assert.ok(unclutter.compare(clear, cluttered) < 0)

  const phaseTwoFen = '2k5/8/4K3/8/5B2/5B2/8/8 w - - 4 3'
  const phaseTwoClear = scoreTwoBishopsWhiteMove(phaseTwoFen, 'Be4')
  const phaseTwoCluttered = scoreTwoBishopsWhiteMove(phaseTwoFen, 'Bc7')
  assert.equal(phaseTwoClear.isPhaseTwoPosition, true)
  assert.equal(phaseTwoCluttered.isPhaseTwoPosition, true)
  assert.equal(unclutter.applies?.(phaseTwoClear), true)
  assert.ok(unclutter.compare(phaseTwoClear, phaseTwoCluttered) < 0)
})

test('unclutter bishops leaves moves tied once both bishops are more than two steps from corners', () => {
  const fen = '8/7k/8/4B3/8/2B5/8/K7 w - - 0 1'
  const unclutter = twoBishopsWhiteRules.find(
    ({ id }) => id === 'unclutter bishops',
  )
  const first = scoreTwoBishopsWhiteMove(fen, 'Bb4')
  const second = scoreTwoBishopsWhiteMove(fen, 'Bcd4')

  assert.equal(first.clutteredBishopsCount, 0)
  assert.equal(second.clutteredBishopsCount, 0)
  assert.ok(unclutter?.compare)
  assert.equal(unclutter.compare(first, second), 0)
})

test('unclutter bishops is D4 symmetric', () => {
  const sourceFen = '8/7k/8/4B3/8/2B5/8/K7 w - - 0 1'
  const sourceMove = getChess(sourceFen).move('Bb4')
  assert.ok(sourceMove)

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(sourceFen, transform)).fen()
    const move = getChess(fen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    assert.ok(move, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, move.san).clutteredBishopsCount,
      0,
      transform.name,
    )
  }
})

test('king closer scores bishop waiting moves that preserve its preferred position', () => {
  const source = '8/8/8/8/5B1k/5B2/5K2/8 w - - 0 1'

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const from = transformSquare('f3', transform)
    const to = transformSquare('e2', transform)
    const waitingMove = getChess(fen)
      .moves({ verbose: true })
      .find((move) => move.from === from && move.to === to)

    assert.ok(waitingMove, `${transform.name}: waiting move`)
    const score = scoreTwoBishopsWhiteMove(fen, waitingMove.san)
    assert.equal(
      score.kingCloserPhaseTwoLinePenalty,
      0,
      `${transform.name}: preferred line`,
    )
    assert.equal(score.kingCloserDistance, 8, `${transform.name}: distance`)
  }
})

test('king closer uses global distance before middle sixteen in Phase 2', () => {
  const source = '6k1/8/5BB1/5K2/8/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const central = scoreTwoBishopsWhiteMove(source, 'Ke6')
  const outside = scoreTwoBishopsWhiteMove(source, 'Kg5')

  assert.equal(ruleSet.phase(source), '2/2')
  assert.equal(central.kingCloserDistance, 8)
  assert.equal(central.kingCloserMiddleSixteenDistance, 0)
  assert.equal(outside.kingCloserDistance, 9)
  assert.equal(outside.kingCloserMiddleSixteenDistance, 1)
  assert.ok(
    compareTwoBishopsWhiteScores(
      {
        ...central,
        kingCloserDistance: 8,
        kingCloserMiddleSixteenDistance: 1,
      },
      {
        ...central,
        kingCloserDistance: 9,
        kingCloserMiddleSixteenDistance: 0,
      },
    ) < 0,
  )
})

test('force phase 2 allows the king to leave the middle while clear of the edge', () => {
  const fen = '8/8/8/8/7k/5K2/3B4/3B4 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.equal(ruleSet.phase(fen), '2/2')
  assert.ok(ruleSet.idealWhiteMoves(fen).length > 0)
  assert.ok(
    ruleSet
      .idealWhiteMoves(fen)
      .every(
        (san) => scoreTwoBishopsWhiteMove(fen, san).forcePhaseTwoPenalty === 0,
      ),
  )
  const score = scoreTwoBishopsWhiteMove(fen, 'Kf2')
  assert.equal(score.forcePhaseTwoPenalty, 0)
  assert.notEqual(ruleSet.explainWhiteMove(fen, 'Kf2')?.id, 'force phase 2')
})

test('phase 2 wall recognizes the approved wall geometry', () => {
  const examples = [
    {
      fen: '2k5/8/2B1K3/8/8/6B1/8/8 w - - 0 1',
      move: 'Bf4',
    },
    {
      fen: '3k4/8/4K3/8/4BB2/8/8/8 w - - 6 4',
      move: 'Bb7',
    },
  ] as const
  for (const { fen: source, move: sourceSan } of examples) {
    const sourceMove = getChess(source)
      .moves({ verbose: true })
      .find(({ san }) => san === sourceSan)
    assert.ok(sourceMove)

    for (const transform of SQUARE_TRANSFORMS) {
      const fen = getChess(transformFen(source, transform)).fen()
      const from = transformSquare(sourceMove.from, transform)
      const to = transformSquare(sourceMove.to, transform)
      const move = getChess(fen)
        .moves({ verbose: true })
        .find((candidate) => candidate.from === from && candidate.to === to)
      assert.ok(move, `${transform.name}: ${fen}`)
      const score = scoreTwoBishopsWhiteMove(fen, move.san)
      assert.equal(score.phaseTwoWallApplies, true, fen)
      assert.equal(score.phaseTwoWallPenalty, 0, `${fen}: ${move.san}`)
    }
  }

  assert.equal(
    scoreTwoBishopsWhiteMove(examples[0].fen, 'Kd6').phaseTwoWallPenalty,
    1,
  )
})

test('near-corner targeting keeps the forced Phase 2 move unique', () => {
  const source = '4B3/7k/5B2/8/5K2/8/8/8 w - - 0 1'
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Bf7')
  assert.ok(sourceMove)

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const from = transformSquare(sourceMove.from, transform)
    const to = transformSquare(sourceMove.to, transform)
    const move = getChess(fen)
      .moves({ verbose: true })
      .find((candidate) => candidate.from === from && candidate.to === to)
    assert.ok(move, `${transform.name}: ${fen}`)

    const ruleSet = getMateRuleSet('two-bishops')
    const score = scoreTwoBishopsWhiteMove(fen, move.san)
    assert.equal(score.phaseTwoWallApplies, true, fen)
    assert.equal(score.phaseTwoWallPenalty, 1, `${fen}: ${move.san}`)
    assert.equal(score.sequesterCurrentCornerDistance, 1, fen)
    assert.equal(score.sequesterTargetCornerScore, 0, fen)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [move.san], fen)
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'force phase 2', fen)
  }
})

test('phase 2 wall is inactive before Phase 2', () => {
  const fen = '8/8/8/8/4k3/8/3BB3/5K2 w - - 0 1'
  assert.equal(isTwoBishopsPhaseTwoPosition(fen), false)
  for (const san of getChess(fen).moves()) {
    assert.equal(scoreTwoBishopsWhiteMove(fen, san).phaseTwoWallApplies, false)
  }
})

test("phase 2 wall permits an edge bishop but rejects orthogonal king adjacency", () => {
  const edgeBishopFen = 'B1k5/8/4K3/8/5B2/8/8/8 w - - 0 1'
  const edgeBishopScore = scoreTwoBishopsWhiteMove(edgeBishopFen, 'Be5')
  assert.equal(edgeBishopScore.bishopsOnBlackEdgeCount, 1)
  assert.equal(edgeBishopScore.phaseTwoWallPenalty, 0)

  const touchingKingFen = '4k3/7B/5K1B/8/8/8/8/8 w - - 2 2'
  assert.equal(
    scoreTwoBishopsWhiteMove(touchingKingFen, 'Bg6+')
      .phaseTwoWallPenalty,
    1,
  )
})

test('bishops off edge prefers 0 bishops over 1 over 2 under D4 symmetry', () => {
  const source = '7B/8/6B1/8/7k/5K2/8/8 w - - 0 1'
  const sourceMoves = [
    { count: 0, from: 'h8', to: 'g7' },
    { count: 1, from: 'g6', to: 'f7' },
    { count: 2, from: 'g6', to: 'h7' },
  ] as const
  const rule = twoBishopsWhiteRules.find(
    ({ id }) => id === 'bishops off edge',
  )
  assert.ok(rule?.applies)
  assert.ok(rule.compare)

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const scores = sourceMoves.map(({ count, from, to }) => {
      const transformedFrom = transformSquare(from, transform)
      const transformedTo = transformSquare(to, transform)
      const move = getChess(fen)
        .moves({ verbose: true })
        .find(
          (candidate) =>
            candidate.from === transformedFrom &&
            candidate.to === transformedTo,
        )
      assert.ok(move, `${transform.name}: ${from}-${to}`)
      const score = scoreTwoBishopsWhiteMove(fen, move.san)
      assert.equal(score.bishopsOnBlackEdgeCount, count, transform.name)
      assert.equal(rule.applies?.(score), true, transform.name)
      return score
    })
    assert.ok(rule.compare(scores[0]!, scores[1]!) < 0, transform.name)
    assert.ok(rule.compare(scores[1]!, scores[2]!) < 0, transform.name)
  }
})

test('bishops off edge is inactive before Phase 2', () => {
  const fen = '8/8/8/8/4k3/8/3BB3/5K2 w - - 0 1'
  const rule = twoBishopsWhiteRules.find(
    ({ id }) => id === 'bishops off edge',
  )
  assert.ok(rule?.applies)
  for (const san of getChess(fen).moves()) {
    assert.equal(rule.applies(scoreTwoBishopsWhiteMove(fen, san)), false)
  }
})

test('phase 2 wall does not become an edge-clearing fallback', () => {
  const fen = '5B2/8/8/8/4BK1k/8/8/8 w - - 4 3'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.ok(
    getChess(fen)
      .moves()
      .every(
        (san) =>
          scoreTwoBishopsWhiteMove(fen, san).phaseTwoWallPenalty === 1,
      ),
  )
  assert.ok(ruleSet.idealWhiteMoves(fen).includes('Bg6'))
  assert.notEqual(ruleSet.explainWhiteMove(fen, 'Bg6')?.id, 'phase 2 wall')
})

test("phase 2 wall cannot touch White's king", () => {
  const source = '8/8/8/2KB4/k7/2B5/8/8 w - - 2 2'
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Bc4')
  assert.ok(sourceMove)

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const move: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(sourceMove.from, transform) &&
        to === transformSquare(sourceMove.to, transform),
    )
    assert.ok(move, transform.name)
    const score = scoreTwoBishopsWhiteMove(fen, move.san)
    assert.equal(
      score.sequesterCurrentCornerDistance,
      4,
      `${transform.name}: target remains a8 equivalent`,
    )
    assert.equal(score.phaseTwoWallPenalty, 1, transform.name)
  }
})

test('phase 2 opposition degenerate supersedes the older Bd4 wall fixture', () => {
  const fen = '8/6B1/8/3B4/5K2/8/7k/8 w - - 4 3'
  const ruleSet = getMateRuleSet('two-bishops')
  const score = scoreTwoBishopsWhiteMove(fen, 'Bd4')

  assert.equal(ruleSet.phase(fen), '2/2')
  assert.equal(score.phaseTwoWallApplies, true)
  assert.equal(score.phaseTwoWallPenalty, 1)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kf3'])
  assert.equal(
    ruleSet.currentWhiteHint(fen)?.shortLabel,
    'degenerate — phase 2 opposition',
  )
})

test('king-race target lets phase 2 wall uniquely select Bb2', () => {
  const source = '8/8/8/4BB2/8/4K3/8/3k4 w - - 2 2'
  const sourceMoves = getChess(source).moves({ verbose: true })
  const expectedSource = sourceMoves.find(({ san }) => san === 'Bb2')
  const rejectedSource = sourceMoves.find(({ san }) => san === 'Bg3')
  assert.ok(expectedSource)
  assert.ok(rejectedSource)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const transformedMove = (
      sourceMove: { readonly from: Square; readonly to: Square },
    ): (typeof moves)[number] | undefined =>
      moves.find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    const expected = transformedMove(expectedSource)
    const rejected = transformedMove(rejectedSource)
    assert.ok(expected, transform.name)
    assert.ok(rejected, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, expected.san).sequesterTargetCornerScore,
      1,
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, rejected.san).sequesterTargetCornerScore,
      1,
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, expected.san)
        .sequesterCurrentCornerDistance,
      4,
      `${transform.name}: target is the h1 equivalent`,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, rejected.san)
        .sequesterCurrentCornerDistance,
      4,
      `${transform.name}: bishop placement cannot change the target`,
    )
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], transform.name)
    assert.equal(
      ruleSet.currentWhiteHint(fen)?.id,
      'sequester',
      transform.name,
    )
  }
})

test('zero-sum opposition falls through to White king proximity', () => {
  const source = '8/8/8/8/8/2B2BK1/8/6k1 w - - 2 2'
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Bd2')
  assert.ok(sourceMove)

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const move: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(sourceMove.from, transform) &&
        to === transformSquare(sourceMove.to, transform),
    )
    assert.ok(move, transform.name)
    const expectedTarget = transformSquare('h1', transform)
    const blackKing = findPiece(fen, 'b', 'k')?.square
    assert.ok(blackKing)
    assert.equal(kingDistance(blackKing, expectedTarget), 1, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, move.san)
        .sequesterCurrentCornerDistance,
      1,
      `${transform.name}: target is the h1 equivalent`,
    )
  }
})

test('opposition target counts physical bishop sides under D4 symmetry', () => {
  const source = '6B1/8/8/4BK1k/8/8/8/8 w - - 0 1'
  const sourceMoves = getChess(source).moves({ verbose: true })
  const groupedSource = sourceMoves.find(({ san }) => san === 'Bg7')
  const splitSource = sourceMoves.find(({ san }) => san === 'Bg3')
  const oppositeSource = sourceMoves.find(({ san }) => san === 'Ba1')
  assert.ok(groupedSource)
  assert.ok(splitSource)
  assert.ok(oppositeSource)

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const transformedMove = (
      sourceMove: { readonly from: Square; readonly to: Square },
    ): (typeof moves)[number] | undefined =>
      moves.find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    const grouped = transformedMove(groupedSource)
    const split = transformedMove(splitSource)
    const opposite = transformedMove(oppositeSource)
    assert.ok(grouped, transform.name)
    assert.ok(split, transform.name)
    assert.ok(opposite, transform.name)

    const groupedScore = scoreTwoBishopsWhiteMove(fen, grouped.san)
    const splitScore = scoreTwoBishopsWhiteMove(fen, split.san)
    const oppositeScore = scoreTwoBishopsWhiteMove(fen, opposite.san)
    assert.equal(groupedScore.sequesterTargetCornerScore, 2, transform.name)
    assert.equal(splitScore.sequesterTargetCornerScore, 0, transform.name)
    assert.equal(oppositeScore.sequesterTargetCornerScore, 0, transform.name)
    assert.equal(
      groupedScore.sequesterCurrentCornerDistance,
      4,
      `${transform.name}: collective h8-side displacement targets h1`,
    )
    assert.equal(
      splitScore.sequesterCurrentCornerDistance,
      3,
      `${transform.name}: one bishop on each side falls through to h8`,
    )
    assert.equal(
      oppositeScore.sequesterCurrentCornerDistance,
      3,
      `${transform.name}: physical side counts tie regardless of distance`,
    )
  }
})

test('opposition bishop side makes Bg7 target a8 under D4 symmetry', () => {
  const source = '4k3/7B/4K3/8/3B4/8/8/8 w - - 0 1'
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Bg7')
  assert.ok(sourceMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const move: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(sourceMove.from, transform) &&
        to === transformSquare(sourceMove.to, transform),
    )
    assert.ok(move, transform.name)
    const score = scoreTwoBishopsWhiteMove(fen, move.san)
    assert.equal(score.sequesterTargetCornerScore, 2, transform.name)
    assert.equal(
      score.sequesterCurrentCornerDistance,
      4,
      `${transform.name}: target is the a8 equivalent`,
    )
    assert.equal(score.sequesterMaximumCornerReplyDistance, 3, transform.name)
    assert.ok(ruleSet.idealWhiteMoves(fen).includes(move.san), transform.name)
    assert.equal(ruleSet.explainWhiteMove(fen, move.san)?.id, 'sequester')
  }
})

test('sequester accepts enforceable corner progress before target strength', () => {
  const source = '2kB4/8/2K5/1B6/8/8/8/8 w - - 2 2'
  const sourceMoves = getChess(source).moves({ verbose: true })
  const expectedSource = sourceMoves.find(({ san }) => san === 'Be7')
  const strongerSource = sourceMoves.find(({ san }) => san === 'Ba5')
  assert.ok(expectedSource)
  assert.ok(strongerSource)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const transformedMove = (
      sourceMove: { readonly from: Square; readonly to: Square },
    ): (typeof moves)[number] | undefined =>
      moves.find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    const expected = transformedMove(expectedSource)
    const stronger = transformedMove(strongerSource)
    assert.ok(expected, transform.name)
    assert.ok(stronger, transform.name)

    const expectedScore = scoreTwoBishopsWhiteMove(fen, expected.san)
    const strongerScore = scoreTwoBishopsWhiteMove(fen, stronger.san)
    assert.ok(
      expectedScore.sequesterTargetCornerScore <
        strongerScore.sequesterTargetCornerScore,
      transform.name,
    )
    assert.ok(
      expectedScore.sequesterMaximumCornerReplyDistance <
        expectedScore.sequesterCurrentCornerDistance,
      transform.name,
    )
    assert.ok(
      strongerScore.sequesterMaximumCornerReplyDistance >
        strongerScore.sequesterCurrentCornerDistance,
      transform.name,
    )
    const idealMoves = ruleSet.idealWhiteMoves(fen)
    assert.ok(idealMoves.includes(expected.san), transform.name)
    assert.ok(!idealMoves.includes(stronger.san), transform.name)
    assert.ok(
      idealMoves.every((san) => {
        const score = scoreTwoBishopsWhiteMove(fen, san)
        return (
          score.sequesterMaximumCornerReplyDistance <
          score.sequesterCurrentCornerDistance
        )
      }),
      transform.name,
    )
    assert.equal(ruleSet.explainWhiteMove(fen, stronger.san)?.id, 'sequester')
  }
})

test('shepherd uniquely takes opposition toward the target under D4 symmetry', () => {
  const source = '3k4/6BB/4K3/8/8/8/8/8 w - - 0 1'
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Kd6')
  assert.ok(sourceMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const move: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(sourceMove.from, transform) &&
        to === transformSquare(sourceMove.to, transform),
    )
    assert.ok(move, transform.name)
    const score = scoreTwoBishopsWhiteMove(fen, move.san)
    assert.equal(score.shepherdApplies, true, transform.name)
    assert.equal(score.shepherdPenalty, 0, transform.name)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [move.san], transform.name)
    assert.equal(
      ruleSet.explainWhiteMove(fen, move.san)?.id,
      'shepherd',
      transform.name,
    )
  }
})

test('shepherd does not use a cutoff on the target-corner side', () => {
  const fen = '3k4/BB6/4K3/8/8/8/8/8 w - - 0 1'

  for (const san of getChess(fen).moves()) {
    assert.equal(scoreTwoBishopsWhiteMove(fen, san).shepherdApplies, false)
  }
})

test('split bishop sides make Bc7 uniquely correct under D4 symmetry', () => {
  const source = '4k3/1B6/3BK3/8/8/8/8/8 w - - 0 1'
  const sourceMoves = getChess(source).moves({ verbose: true })
  const expectedSource = sourceMoves.find(({ san }) => san === 'Bc7')
  const rejectedSource = sourceMoves.find(({ san }) => san === 'Bg2')
  assert.ok(expectedSource)
  assert.ok(rejectedSource)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const transformedMove = (
      sourceMove: { readonly from: Square; readonly to: Square },
    ): (typeof moves)[number] | undefined =>
      moves.find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    const expected = transformedMove(expectedSource)
    const rejected = transformedMove(rejectedSource)
    assert.ok(expected, transform.name)
    assert.ok(rejected, transform.name)
    const rejectedScore = scoreTwoBishopsWhiteMove(fen, rejected.san)
    const expectedScore = scoreTwoBishopsWhiteMove(fen, expected.san)
    assert.equal(expectedScore.sequesterTargetCornerScore, 2, transform.name)
    assert.equal(rejectedScore.sequesterTargetCornerScore, 0, transform.name)
    assert.equal(
      rejectedScore.sequesterCurrentCornerDistance,
      3,
      `${transform.name}: split sides fall through to the h8 equivalent`,
    )
    assert.equal(rejectedScore.sequesterMaximumCornerReplyDistance, 4)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], transform.name)
  }
})

test('target score reports the greatest king-race lead under D4 symmetry', () => {
  const source = '8/8/8/4BB2/8/4K3/8/3k4 w - - 2 2'
  const sourceMoves = getChess(source).moves({ verbose: true })
  const winningRaceSource = sourceMoves.find(({ san }) => san === 'Kf3')
  const noWinningRaceSource = sourceMoves.find(({ san }) => san === 'Kd4')
  assert.ok(winningRaceSource)
  assert.ok(noWinningRaceSource)

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const transformedMove = (
      sourceMove: { readonly from: Square; readonly to: Square },
    ): (typeof moves)[number] | undefined =>
      moves.find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    const winningRace = transformedMove(winningRaceSource)
    const noWinningRace = transformedMove(noWinningRaceSource)
    assert.ok(winningRace, transform.name)
    assert.ok(noWinningRace, transform.name)

    assert.equal(
      scoreTwoBishopsWhiteMove(fen, winningRace.san)
        .sequesterTargetCornerScore,
      2,
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, noWinningRace.san)
        .sequesterTargetCornerScore,
      0,
      transform.name,
    )
  }
})

test('bishop score targets h8 and uniquely selects Ba7 under D4 symmetry', () => {
  const source = '2k5/8/2BK4/8/3B4/8/8/8 w - - 2 2'
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Ba7')
  assert.ok(sourceMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const move: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(sourceMove.from, transform) &&
        to === transformSquare(sourceMove.to, transform),
    )
    assert.ok(move, transform.name)
    const score = scoreTwoBishopsWhiteMove(fen, move.san)

    assert.equal(
      score.sequesterCurrentCornerDistance,
      5,
      `${transform.name}: target is the h8 equivalent`,
    )
    assert.equal(score.sequesterMaximumCornerReplyDistance, 4, transform.name)
    assert.equal(score.sequesterTwoAwayControlPenalty, 0, transform.name)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [move.san], transform.name)
  }
})

test('corner-diagonals f7 exclusion remains terminal under near-corner targeting', () => {
  const source = '8/8/8/8/8/3BBK2/7k/8 w - - 2 2'
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Bg5')
  assert.ok(sourceMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const move: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(sourceMove.from, transform) &&
        to === transformSquare(sourceMove.to, transform),
    )
    assert.ok(move, transform.name)
    const score = scoreTwoBishopsWhiteMove(fen, move.san)
    assert.equal(score.sequesterCurrentCornerDistance, 1, transform.name)
    assert.equal(score.sequesterMaximumCornerReplyDistance, 2, transform.name)
    assert.equal(score.sequesterCornerDiagonalsTarget, false, transform.name)
    assert.equal(score.sequesterTwoAwayControlPenalty, 0, transform.name)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [move.san], transform.name)
  }
})

test('opposition bishop side restores the diagonal wall but not the orthogonal case', () => {
  const diagonalSource = '4k3/7B/4K2B/8/8/8/8/8 w - - 2 2'
  const orthogonalSource = '4k3/7B/5K1B/8/8/8/8/8 w - - 2 2'
  const sourceMove = getChess(diagonalSource)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Bg6+')
  assert.ok(sourceMove)

  for (const transform of SQUARE_TRANSFORMS) {
    const diagonalFen = getChess(
      transformFen(diagonalSource, transform),
    ).fen()
    const orthogonalFen = getChess(
      transformFen(orthogonalSource, transform),
    ).fen()
    const diagonalMoves = getChess(diagonalFen).moves({ verbose: true })
    const orthogonalMoves = getChess(orthogonalFen).moves({ verbose: true })
    const diagonalMove: (typeof diagonalMoves)[number] | undefined =
      diagonalMoves.find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    const orthogonalMove: (typeof orthogonalMoves)[number] | undefined =
      orthogonalMoves.find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    assert.ok(diagonalMove, transform.name)
    assert.ok(orthogonalMove, transform.name)

    const diagonalScore = scoreTwoBishopsWhiteMove(
      diagonalFen,
      diagonalMove.san,
    )
    const orthogonalScore = scoreTwoBishopsWhiteMove(
      orthogonalFen,
      orthogonalMove.san,
    )
    assert.equal(diagonalScore.phaseTwoWallPenalty, 0, transform.name)
    assert.equal(
      diagonalScore.sequesterCurrentCornerDistance,
      4,
      `${transform.name}: opposition bishop side targets the a8 equivalent`,
    )
    assert.equal(diagonalScore.sequesterMaximumCornerReplyDistance, 3)
    assert.equal(orthogonalScore.phaseTwoWallPenalty, 1, transform.name)
  }
})

test('sequester keeps a current-board target across candidate arrangements', () => {
  const sameSide = '8/8/8/8/5K2/7k/3B4/3B4 w - - 0 1'
  const oneAligned = '8/8/8/8/5K2/4B2k/3B4/8 w - - 0 1'
  const splitSides = '8/8/8/3B4/5K1k/8/4B3/8 w - - 0 1'
  const bothAligned = '8/8/8/8/5K2/2BB3k/8/8 w - - 0 1'
  const corner = '8/8/8/8/8/5K2/3BB3/7k w - - 0 1'

  for (const fen of [sameSide, oneAligned, corner, splitSides, bothAligned]) {
    assert.equal(isTwoBishopsPhaseTwoPosition(fen), true)
    assert.ok(
      getChess(fen)
        .moves()
        .every((san) => scoreTwoBishopsWhiteMove(fen, san).sequesterApplies),
      fen,
    )
  }

  assert.equal(
    scoreTwoBishopsWhiteMove(sameSide, 'Kf3').sequesterHasTargetCorner,
    true,
  )
  for (const [fen, san] of [
    [splitSides, 'Ke5'],
    [splitSides, 'Be4'],
    [bothAligned, 'Kf3'],
    [bothAligned, 'Bb4'],
  ] as const) {
    const score = scoreTwoBishopsWhiteMove(fen, san)
    assert.equal(score.sequesterHasTargetCorner, true, `${fen}: ${san}`)
    assert.notEqual(
      score.sequesterMaximumCornerReplyDistance,
      99,
      `${fen}: ${san}`,
    )
  }
})

test('sequester edge targeting follows every D4 transform', () => {
  const source = '8/8/8/8/5K2/7k/3B4/3B4 w - - 0 1'
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Kf3')
  assert.ok(sourceMove)
  const sourceScore = scoreTwoBishopsWhiteMove(source, sourceMove.san)

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const from = transformSquare(sourceMove.from, transform)
    const to = transformSquare(sourceMove.to, transform)
    const move = getChess(fen)
      .moves({ verbose: true })
      .find((candidate) => candidate.from === from && candidate.to === to)
    assert.ok(move, `${transform.name}: ${fen}`)
    const score = scoreTwoBishopsWhiteMove(fen, move.san)
    assert.equal(score.sequesterApplies, true, fen)
    assert.equal(score.sequesterHasTargetCorner, true, fen)
    assert.equal(
      score.sequesterMaximumCornerReplyDistance,
      sourceScore.sequesterMaximumCornerReplyDistance,
      fen,
    )
  }
})

test('sequester does not require the bishops to establish the target corner', () => {
  const fen = '8/8/8/6B1/8/8/5K1k/3B4 w - - 0 1'
  const score = scoreTwoBishopsWhiteMove(fen, 'Bg4')
  const splitScore = scoreTwoBishopsWhiteMove(fen, 'Bd8')

  assert.equal(isTwoBishopsPhaseTwoPosition(fen), true)
  assert.equal(score.isPhaseTwoPosition, true)
  assert.equal(score.sequesterApplies, true)
  assert.equal(score.sequesterHasTargetCorner, true)
  assert.equal(splitScore.sequesterHasTargetCorner, true)
  assert.notEqual(score.sequesterMaximumCornerReplyDistance, 99)
  assert.notEqual(splitScore.sequesterMaximumCornerReplyDistance, 99)
})

test('Black adjacent to a corner fixes that target under D4 symmetry', () => {
  const source = '8/8/8/8/8/8/3B1K1k/3B4 w - - 2 2'
  const sourceMoves = getChess(source).moves({ verbose: true })
  const expectedSource = sourceMoves.find(({ san }) => san === 'Bg4')
  const retargetSource = sourceMoves.find(({ san }) => san === 'Be1')
  assert.ok(expectedSource)
  assert.ok(retargetSource)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const transformedMove = (
      sourceMove: { readonly from: Square; readonly to: Square },
    ): (typeof moves)[number] | undefined =>
      moves.find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    const expected = transformedMove(expectedSource)
    const retarget = transformedMove(retargetSource)
    assert.ok(expected, transform.name)
    assert.ok(retarget, transform.name)
    const expectedScore = scoreTwoBishopsWhiteMove(fen, expected.san)
    const retargetScore = scoreTwoBishopsWhiteMove(fen, retarget.san)
    assert.equal(expectedScore.sequesterTargetCornerScore, 0, transform.name)
    assert.equal(retargetScore.sequesterTargetCornerScore, 0, transform.name)
    assert.equal(
      expectedScore.sequesterMaximumCornerReplyDistance,
      0,
      transform.name,
    )
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], transform.name)
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'sequester', transform.name)
  }
})

test('closest-White target owns positions without mate-prep diagonal access', () => {
  const source = '8/k7/2K4B/8/8/8/8/7B w - - 0 1'
  const sourceMoves = getChess(source).moves({ verbose: true })
  const expectedSource = sourceMoves.find(({ san }) => san === 'Bd2')
  const matePrepSource = sourceMoves.find(({ san }) => san === 'Kc7')
  assert.ok(expectedSource)
  assert.ok(matePrepSource)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const expected: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(expectedSource.from, transform) &&
        to === transformSquare(expectedSource.to, transform),
    )
    const matePrep: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(matePrepSource.from, transform) &&
        to === transformSquare(matePrepSource.to, transform),
    )
    assert.ok(expected, transform.name)
    assert.ok(matePrep, transform.name)
    const score = scoreTwoBishopsWhiteMove(fen, expected.san)
    assert.equal(score.sequesterCurrentCornerDistance, 1, transform.name)
    assert.equal(score.sequesterMaximumCornerReplyDistance, 2, transform.name)
    assert.equal(score.sequesterTwoAwayControlPenalty, 0, transform.name)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'sequester', fen)
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — mate prep',
      fen,
    )
  }

  assert.equal(
    scoreTwoBishopsWhiteMove(source, matePrepSource.san)
      .sequesterTwoAwayControlPenalty,
    1,
  )
})

test('near-corner target overrides the controlled two-away cutoff under D4 symmetry', () => {
  const source = '4B3/8/8/8/5B2/2K5/k7/8 w - - 2 2'
  const sourceMoves = getChess(source).moves({ verbose: true })
  const expectedSource = sourceMoves.find(({ san }) => san === 'Kc2')
  assert.ok(expectedSource)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const transformedMove = (
      sourceMove: { readonly from: Square; readonly to: Square },
    ): (typeof moves)[number] | undefined =>
      moves.find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    const expected = transformedMove(expectedSource)
    assert.ok(expected, transform.name)
    const expectedScore = scoreTwoBishopsWhiteMove(fen, expected.san)
    assert.equal(expectedScore.sequesterCurrentCornerDistance, 1)
    assert.equal(expectedScore.sequesterMaximumCornerReplyDistance, 2)
    assert.equal(expectedScore.sequesterTargetCornerScore, 0)
    assert.equal(expectedScore.sequesterCornerDiagonalsTarget, false)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], transform.name)
    assert.equal(ruleSet.explainWhiteMove(fen, expected.san)?.id, 'king closer')
  }
})

test('mate prep falls through when neither bishop controls its diagonal', () => {
  const source = '8/3B4/8/8/8/2K3B1/8/1k6 w - - 2 2'
  const sourceMoves = getChess(source).moves({ verbose: true })
  const expectedSource = sourceMoves.find(({ san }) => san === 'Bf4')
  const driftingSource = sourceMoves.find(({ san }) => san === 'Bg4')
  const matePrepSource = sourceMoves.find(({ san }) => san === 'Kb3')
  assert.ok(expectedSource)
  assert.ok(driftingSource)
  assert.ok(matePrepSource)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const transformedMove = (
      sourceMove: { readonly from: Square; readonly to: Square },
    ): (typeof moves)[number] | undefined =>
      moves.find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    const expected = transformedMove(expectedSource)
    const drifting = transformedMove(driftingSource)
    const matePrep = transformedMove(matePrepSource)
    assert.ok(expected, transform.name)
    assert.ok(drifting, transform.name)
    assert.ok(matePrep, transform.name)
    const expectedScore = scoreTwoBishopsWhiteMove(fen, expected.san)
    const driftingScore = scoreTwoBishopsWhiteMove(fen, drifting.san)
    assert.equal(expectedScore.sequesterCornerDiagonalsTarget, false)
    assert.equal(driftingScore.sequesterCornerDiagonalsTarget, false)
    assert.equal(expectedScore.sequesterCurrentCornerDistance, 1)
    assert.equal(expectedScore.sequesterMaximumCornerReplyDistance, 1)
    assert.equal(driftingScore.sequesterCurrentCornerDistance, 1)
    assert.equal(driftingScore.sequesterMaximumCornerReplyDistance, 2)
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — mate prep',
      transform.name,
    )
    assert.ok(
      ruleSet.idealWhiteMoves(fen).includes(drifting.san),
      transform.name,
    )
    assert.equal(
      ruleSet.idealWhiteMoves(fen).includes(matePrep.san),
      false,
      transform.name,
    )
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'sequester')
  }
})

test('near-corner target keeps only the valid corner-diagonals occupancy', () => {
  const source = '8/k7/2K5/5BB1/8/8/8/8 w - - 2 2'
  const sourceMoves = getChess(source).moves({ verbose: true })
  const expectedSource = sourceMoves.find(({ san }) => san === 'Bd2')
  const splitSource = sourceMoves.find(({ san }) => san === 'Bd8')
  assert.ok(expectedSource)
  assert.ok(splitSource)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const transformedMove = (
      sourceMove: { readonly from: Square; readonly to: Square },
    ): (typeof moves)[number] | undefined =>
      moves.find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    const expected = transformedMove(expectedSource)
    const split = transformedMove(splitSource)
    assert.ok(expected, transform.name)
    assert.ok(split, transform.name)
    const expectedScore = scoreTwoBishopsWhiteMove(fen, expected.san)
    const splitScore = scoreTwoBishopsWhiteMove(fen, split.san)
    assert.equal(expectedScore.degeneratePenalty, 0)
    assert.equal(splitScore.degeneratePenalty, 1)
    assert.equal(expectedScore.sequesterCornerDiagonalsTarget, false)
    assert.equal(splitScore.sequesterCornerDiagonalsTarget, false)
    assert.equal(expectedScore.sequesterTargetCornerScore, 0)
    assert.equal(splitScore.sequesterTargetCornerScore, 0)
    assert.deepEqual(
      ruleSet.idealWhiteMoves(fen),
      [expected.san],
      transform.name,
    )
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'degenerate')
  }
})

test('sequester uses either edge square two steps from Black', () => {
  const source = '8/6BB/8/8/5K2/7k/8/8 w - - 0 1'
  const sourceMoves = getChess(source).moves({ verbose: true })
  const expectedSource = sourceMoves.find(({ san }) => san === 'Be4')
  const cyclingSource = sourceMoves.find(({ san }) => san === 'Kf3')
  assert.ok(expectedSource)
  assert.ok(cyclingSource)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const expected: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(expectedSource.from, transform) &&
        to === transformSquare(expectedSource.to, transform),
    )
    const cycling: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(cyclingSource.from, transform) &&
        to === transformSquare(cyclingSource.to, transform),
    )
    assert.ok(expected, transform.name)
    assert.ok(cycling, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, expected.san)
        .sequesterTwoAwayControlPenalty,
      0,
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, cycling.san)
        .sequesterTwoAwayControlPenalty,
      1,
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, expected.san)
        .sequesterTargetCornerScore,
      1,
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, cycling.san)
        .sequesterTargetCornerScore,
      0,
      transform.name,
    )
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'sequester', fen)
  }
})

test('mate-in-four degenerate owns overlapping sequester geometry', () => {
  const source = '8/8/8/5B2/8/4BK2/7k/8 w - - 2 2'
  const sourceMoves = getChess(source).moves({ verbose: true })
  const expectedSource = sourceMoves.find(({ san }) => san === 'Kf2')
  const edgeControlSource = sourceMoves.find(({ san }) => san === 'Bf2')
  assert.ok(expectedSource)
  assert.ok(edgeControlSource)
  const ruleSet = getMateRuleSet('two-bishops')
  const sequester = twoBishopsWhiteRules.find(
    ({ id }) => id === 'sequester',
  )
  assert.equal(sequester?.subpriorities?.length, 4)

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const expected: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(expectedSource.from, transform) &&
        to === transformSquare(expectedSource.to, transform),
    )
    const edgeControl: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(edgeControlSource.from, transform) &&
        to === transformSquare(edgeControlSource.to, transform),
    )
    assert.ok(expected, transform.name)
    assert.ok(edgeControl, transform.name)
    const expectedScore = scoreTwoBishopsWhiteMove(fen, expected.san)
    const edgeControlScore = scoreTwoBishopsWhiteMove(fen, edgeControl.san)
    assert.equal(expectedScore.sequesterCurrentCornerDistance, 1)
    assert.equal(expectedScore.sequesterMaximumCornerReplyDistance, 0)
    assert.equal(edgeControlScore.sequesterMaximumCornerReplyDistance, 0)
    assert.equal(edgeControlScore.sequesterTwoAwayControlPenalty, 0)
    assert.equal(
      sequester.subpriorities?.[2]?.when?.([
        expectedScore,
        edgeControlScore,
      ]),
      false,
      transform.name,
    )
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'degenerate', fen)
  }
})

test('resulting valid wall direction agrees with the board-derived target', () => {
  const source = '8/8/8/8/8/4BB1k/5K2/8 w - - 2 2'
  const sourceMoves = getChess(source).moves({ verbose: true })
  const expectedSource = sourceMoves.find(({ san }) => san === 'Bg5')
  assert.ok(expectedSource)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const legalMoves = getChess(fen).moves({ verbose: true })
    const expected: (typeof legalMoves)[number] | undefined = legalMoves.find(
      ({ from, to }) =>
        from === transformSquare(expectedSource.from, transform) &&
        to === transformSquare(expectedSource.to, transform),
    )
    assert.ok(expected, transform.name)
    const expectedScore = scoreTwoBishopsWhiteMove(fen, expected.san)
    assert.equal(expectedScore.sequesterCurrentCornerDistance, 2)
    assert.equal(expectedScore.sequesterMaximumCornerReplyDistance, 1)
    assert.equal(expectedScore.phaseTwoWallPenalty, 0, fen)
    assert.equal(ruleSet.explainWhiteMove(fen, expected.san)?.id, 'sequester')
  }
})

test('king-race target applies outside direct opposition', () => {
  const raceSource = '8/8/8/8/2K5/2B5/k1B5/8 w - - 10 6'
  const lowCornerWallSource = '8/6B1/8/8/4K2k/5B2/8/8 w - - 0 1'
  const highCornerWallSource = '8/8/8/8/4KB1k/8/6B1/8 w - - 0 1'
  const raceMove = getChess(raceSource)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Bh8')
  const lowCornerWallMove = getChess(lowCornerWallSource)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Bf8')
  const highCornerWallMove = getChess(highCornerWallSource)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Be5')
  assert.ok(raceMove)
  assert.ok(lowCornerWallMove)
  assert.ok(highCornerWallMove)

  const targetCases: readonly {
    readonly sourceFen: string
    readonly sourceMove: { readonly from: Square; readonly to: Square }
    readonly expectedDistance: number
  }[] = [
    {
      sourceFen: raceSource,
      sourceMove: raceMove,
      expectedDistance: 1,
    },
    {
      sourceFen: lowCornerWallSource,
      sourceMove: lowCornerWallMove,
      expectedDistance: 3,
    },
    {
      sourceFen: highCornerWallSource,
      sourceMove: highCornerWallMove,
      expectedDistance: 3,
    },
  ]
  for (const transform of SQUARE_TRANSFORMS) {
    for (const {
      sourceFen,
      sourceMove,
      expectedDistance,
    } of targetCases) {
      const fen = getChess(transformFen(sourceFen, transform)).fen()
      const move = getChess(fen).moves({ verbose: true }).find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
      assert.ok(move, transform.name)
      assert.equal(
        scoreTwoBishopsWhiteMove(fen, move.san)
          .sequesterCurrentCornerDistance,
        expectedDistance,
        `${transform.name}: ${sourceFen}`,
      )
    }
  }
})

test('king-race target selects the valid opposite-side wall', () => {
  const fen = '8/5B2/7k/4BK2/8/8/8/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bg8'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf6').phaseTwoWallPenalty, 1)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bg8').phaseTwoWallPenalty, 0)
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'sequester')
})

test('force phase 2 rejects a move that does not hold Black on the edge', () => {
  const fen = '8/8/8/5B2/7B/5K2/8/6k1 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(fen), '2/2')
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bg5').forcePhaseTwoPenalty, 0)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Ke4').forcePhaseTwoPenalty, 1)
  assert.equal(
    scoreTwoBishopsWhiteMove(fen, 'Ke4').forcePhaseTwoApplies,
    true,
  )
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Ke4'), false)
  assert.equal(ruleSet.explainWhiteMove(fen, 'Ke4')?.id, 'degenerate')
  for (const san of ruleSet.idealWhiteMoves(fen)) {
    assert.equal(scoreTwoBishopsWhiteMove(fen, san).forcePhaseTwoPenalty, 0)
  }
})

test('degenerate king lift selects Kg3 when Black is in the corner', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const diagonal = ['a5', 'b4', 'c3', 'd2', 'e1'] as const

  for (const diagonalBishop of diagonal) {
    const fen = kingLiftFen('h1', diagonalBishop)
    assert.equal(ruleSet.phase(fen), '2/2', fen)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kg3'], fen)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — king lift',
      fen,
    )
  }

  for (const otherBishop of ['f5', 'h7', 'b1'] as const) {
    assert.deepEqual(
      ruleSet.idealWhiteMoves(kingLiftFen('h1', 'd2', otherBishop)),
      ['Kg3'],
      otherBishop,
    )
  }
})

test('bishop retreat remains active when White king is clear of the edge', () => {
  const fen = '5K2/5B2/5B1k/8/8/8/8/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(fen), '2/2')
  assert.equal(
    getTwoBishopsDegenerateReasonLabel(fen),
    'degenerate — bishop retreat',
  )
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Be8'])
})

test('bishop retreat follows the new Phase 2 boundary under D4 transforms', () => {
  const source = '5K2/5B2/5B1k/8/8/8/8/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    assert.equal(ruleSet.phase(fen), '2/2', fen)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — bishop retreat',
      fen,
    )
  }
})

test('degenerate bishop retreat rejects a translated edge position', () => {
  const translated = '8/5K2/5B2/5B1k/8/8/8/8 w - - 2 2'

  assert.notEqual(
    getTwoBishopsDegenerateReasonLabel(translated),
    'degenerate — bishop retreat',
  )
})

test('degenerate corner diagonals selects Bf3 in the supplied position', () => {
  const fen = TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateCornerDiagonals.fen
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(fen), '2/2')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bf3'])
  assert.equal(
    getTwoBishopsDegenerateReasonLabel(fen),
    'degenerate — corner diagonals',
  )
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf3').degeneratePenalty, 0)
})

test('degenerate corner diagonals follows exact D4 transforms', () => {
  const source = TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateCornerDiagonals.fen
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const from = transformSquare('b7', transform)
    const target = transformSquare('f3', transform)
    const expected = getChess(fen)
      .moves({ verbose: true })
      .find(
        (move) =>
          move.piece === 'b' &&
          move.from === from &&
          move.to === target,
      )
    assert.ok(expected, fen)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — corner diagonals',
      fen,
    )
  }
})

test('degenerate corner diagonals accepts any clear f8-controlling bishop', () => {
  const fen = '8/1B2B2k/5K2/8/8/8/8/8 w - - 0 1'

  assert.deepEqual(getMateRuleSet('two-bishops').idealWhiteMoves(fen), ['Bf3'])
  assert.equal(
    getTwoBishopsDegenerateReasonLabel(fen),
    'degenerate — corner diagonals',
  )
})

test('degenerate corner diagonals rejects f7 under D4 symmetry', () => {
  const source = '8/7k/4BK2/8/1B6/8/8/8 w - - 0 1'
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Bf7')
  assert.ok(sourceMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const forbiddenMove: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(sourceMove.from, transform) &&
        to === transformSquare(sourceMove.to, transform),
    )
    assert.ok(forbiddenMove, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, forbiddenMove.san).degeneratePenalty,
      1,
      transform.name,
    )
    assert.ok(
      !ruleSet.idealWhiteMoves(fen).includes(forbiddenMove.san),
      transform.name,
    )
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — corner diagonals',
      transform.name,
    )
  }
})

test('degenerate corner diagonals requires occupancy on the d1-h5 diagonal', () => {
  const source = '8/3BB2k/5K2/8/8/8/8/8 w - - 0 1'
  const sourceBadMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Be8')
  const sourceGoodMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Bg4')
  assert.ok(sourceBadMove)
  assert.ok(sourceGoodMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const legalMoves = getChess(fen).moves({ verbose: true })
    const badMove: (typeof legalMoves)[number] | undefined = legalMoves.find(
      ({ from, to }) =>
        from === transformSquare(sourceBadMove.from, transform) &&
        to === transformSquare(sourceBadMove.to, transform),
    )
    const goodMove: (typeof legalMoves)[number] | undefined = legalMoves.find(
      ({ from, to }) =>
        from === transformSquare(sourceGoodMove.from, transform) &&
        to === transformSquare(sourceGoodMove.to, transform),
    )
    assert.ok(badMove, transform.name)
    assert.ok(goodMove, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, badMove.san).degeneratePenalty,
      1,
      transform.name,
    )
    assert.deepEqual(
      ruleSet.idealWhiteMoves(fen),
      [goodMove.san],
      transform.name,
    )
  }
})

test('degenerate xx uniquely establishes h6 control under D4 symmetry', () => {
  const source = TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateXx.fen
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Bd2')
  assert.ok(sourceMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const expected: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(sourceMove.from, transform) &&
        to === transformSquare(sourceMove.to, transform),
    )
    assert.ok(expected, transform.name)
    assert.deepEqual(
      ruleSet.idealWhiteMoves(fen),
      [expected.san],
      transform.name,
    )
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — xx',
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, expected.san).degeneratePenalty,
      0,
      transform.name,
    )
  }
})

test('degenerate xx ignores the dark bishop starting square', () => {
  const fen = '5K1k/5B2/8/8/8/B7/8/8 w - - 0 1'

  assert.deepEqual(getMateRuleSet('two-bishops').idealWhiteMoves(fen), ['Bc1'])
  assert.equal(getTwoBishopsDegenerateReasonLabel(fen), 'degenerate — xx')
})

test('degenerate xx rejects translations and fixed-piece near misses', () => {
  for (const fen of [
    '8/5K1k/5B2/8/8/1B6/8/8 w - - 0 1',
    '5K1k/8/4B3/8/1B6/8/8/8 w - - 0 1',
  ]) {
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — xx',
      fen,
    )
  }
})

test('degenerate mate prep uniquely selects Kf2 under D4 symmetry', () => {
  const source = TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateMatePrep.fen
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Kf2')
  assert.ok(sourceMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const legalMoves = getChess(fen).moves({ verbose: true })
    const expected: (typeof legalMoves)[number] | undefined = legalMoves.find(
      ({ from, to }) =>
        from === transformSquare(sourceMove.from, transform) &&
        to === transformSquare(sourceMove.to, transform),
    )
    assert.ok(expected, transform.name)
    assert.equal(ruleSet.phase(fen), '2/2', transform.name)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], transform.name)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — mate prep',
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, expected.san).degeneratePenalty,
      0,
      transform.name,
    )
  }
})

test('degenerate phase 2 opposition uniquely selects Kf6 under D4 symmetry', () => {
  const source =
    TWO_BISHOPS_DIAGRAM_POSITIONS.degeneratePhaseTwoOpposition.fen
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Kf6')
  assert.ok(sourceMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const legalMoves = getChess(fen).moves({ verbose: true })
    const expected: (typeof legalMoves)[number] | undefined = legalMoves.find(
      ({ from, to }) =>
        from === transformSquare(sourceMove.from, transform) &&
        to === transformSquare(sourceMove.to, transform),
    )
    assert.ok(expected, transform.name)
    assert.equal(ruleSet.phase(fen), '2/2', transform.name)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], transform.name)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — phase 2 opposition',
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, expected.san).degeneratePenalty,
      0,
      transform.name,
    )
  }
})

test('degenerate phase 2 opposition rejects translations and altered geometry', () => {
  for (const fen of [
    '8/6k1/1B6/4K3/8/3B4/8/8 w - - 0 1',
    '6k1/1B6/4K3/8/2B5/8/8/8 w - - 0 1',
  ]) {
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — phase 2 opposition',
      fen,
    )
  }
})

test('degenerate mate prep accepts light control plus dark one-move access under D4 symmetry', () => {
  const source = '8/8/8/8/8/5K2/7k/3BB3 w - - 0 1'
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Kf2')
  assert.ok(sourceMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const legalMoves = getChess(fen).moves({ verbose: true })
    const expected: (typeof legalMoves)[number] | undefined = legalMoves.find(
      ({ from, to }) =>
        from === transformSquare(sourceMove.from, transform) &&
        to === transformSquare(sourceMove.to, transform),
    )
    assert.ok(expected, transform.name)
    assert.equal(ruleSet.phase(fen), '2/2', transform.name)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], transform.name)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — mate prep',
      transform.name,
    )
  }
})

test('degenerate mate prep accepts established dark control under D4 symmetry', () => {
  const source = 'B7/8/8/8/8/4BK2/7k/8 w - - 0 1'
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Kf2')
  assert.ok(sourceMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const legalMoves = getChess(fen).moves({ verbose: true })
    const expected: (typeof legalMoves)[number] | undefined = legalMoves.find(
      ({ from, to }) =>
        from === transformSquare(sourceMove.from, transform) &&
        to === transformSquare(sourceMove.to, transform),
    )
    assert.ok(expected, transform.name)
    assert.equal(ruleSet.phase(fen), '2/2', transform.name)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], transform.name)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — mate prep',
      transform.name,
    )
  }
})

test('degenerate mate prep rejects dark access without established diagonal control', () => {
  const source = '8/7k/5K2/8/8/6B1/8/5B2 w - - 0 1'

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    assert.equal(getMateRuleSet('two-bishops').phase(fen), '2/2', transform.name)
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — mate prep',
      transform.name,
    )
  }
})

test('degenerate mate prep rejects a translated king stencil', () => {
  const phaseOneTranslation =
    '8/6k1/8/5K2/8/3B4/5B2/8 w - - 0 1'

  assert.equal(getMateRuleSet('two-bishops').phase(phaseOneTranslation), '1/2')
  assert.notEqual(
    getTwoBishopsDegenerateReasonLabel(phaseOneTranslation),
    'degenerate — mate prep',
  )
})

test('degenerate ignore-light-bishop uniquely selects Bh6 under D4 symmetry', () => {
  const source =
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateIgnoreLightBishop.fen
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Bh6')
  assert.ok(sourceMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const legalMoves = getChess(fen).moves({ verbose: true })
    const move: (typeof legalMoves)[number] | undefined = legalMoves.find(
      ({ from, to }) =>
        from === transformSquare(sourceMove.from, transform) &&
        to === transformSquare(sourceMove.to, transform),
    )
    assert.ok(move, transform.name)
    assert.equal(ruleSet.phase(fen), '2/2', transform.name)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [move.san], transform.name)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — ignore light-squared bishop',
      transform.name,
    )
  }
})

test('degenerate ignore-light-bishop ignores the light bishop location', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  for (const fen of [
    '4B1k1/6B1/5K2/8/8/8/8/8 w - - 0 1',
    '6k1/6B1/5K2/8/8/8/4B3/8 w - - 0 1',
    '6k1/6B1/5K2/8/B7/8/8/8 w - - 0 1',
  ]) {
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bh6'], fen)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — ignore light-squared bishop',
      fen,
    )
  }
})

test('degenerate ignore-light-bishop rejects translations and dark-bishop changes', () => {
  for (const fen of [
    '3B1k2/5B2/4K3/8/8/8/8/8 w - - 0 1',
    '4B1k1/4B3/5K2/8/8/8/8/8 w - - 0 1',
  ]) {
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — ignore light-squared bishop',
      fen,
    )
  }
})

test('degenerate mate in 4 uniquely selects Kc7 under D4 symmetry', () => {
  const source = TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateMateInFour.fen
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Kc7')
  assert.ok(sourceMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const legalMoves = getChess(fen).moves({ verbose: true })
    const expected: (typeof legalMoves)[number] | undefined = legalMoves.find(
      ({ from, to }) =>
        from === transformSquare(sourceMove.from, transform) &&
        to === transformSquare(sourceMove.to, transform),
    )
    assert.ok(expected, transform.name)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — mate in 4',
      fen,
    )
    assert.equal(
      ruleSet.explainWhiteMove(fen, expected.san)?.shortLabel,
      'degenerate — mate in 4',
      fen,
    )
  }
})

test('degenerate mate in 4 accepts any clear a6-controlling bishop', () => {
  const fen = '8/k7/2KB4/1B6/8/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kc7'])
  assert.equal(
    getTwoBishopsDegenerateReasonLabel(fen),
    'degenerate — mate in 4',
  )
})

test('degenerate mate in 4 rejects translations and geometry near misses', () => {
  for (const fen of [
    '8/8/k1KB4/8/2B5/8/8/8 w - - 0 1',
    '8/k7/3B4/2K5/2B5/8/8/8 w - - 0 1',
    '8/k7/2KB4/8/3B4/8/8/8 w - - 0 1',
  ]) {
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — mate in 4',
      fen,
    )
  }
})

test('degenerate knight-step control uniquely establishes g2 control', () => {
  const source =
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKnightStepControl.fen
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(source), '2/2')
  assert.deepEqual(ruleSet.idealWhiteMoves(source), ['Bd5'])
  assert.equal(
    getTwoBishopsDegenerateReasonLabel(source),
    'degenerate — knight-step control',
  )
  assert.equal(
    ruleSet.currentWhiteHint(source)?.shortLabel,
    'degenerate — knight-step control',
  )
  const result = getChess(source)
  result.move('Bd5')
  assert.deepEqual(result.attackers('g2', 'w'), ['d5'])

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const from = transformSquare('g8', transform)
    const to = transformSquare('d5', transform)
    const expected = getChess(fen)
      .moves({ verbose: true })
      .find((move) => move.from === from && move.to === to)
    assert.ok(expected, fen)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — knight-step control',
      fen,
    )
    const after = getChess(fen)
    after.move(expected.san)
    assert.ok(
      after
        .attackers(transformSquare('g2', transform), 'w')
        .includes(to),
      fen,
    )
  }
})

test('degenerate knight-step control follows translations and D4 transforms', () => {
  const source = '8/k7/2K5/8/8/1B6/1B6/8 w - - 0 1'
  const sourceMove = getChess(source)
    .moves({ verbose: true })
    .find(({ san }) => san === 'Be5')
  assert.ok(sourceMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const legalMoves = getChess(fen).moves({ verbose: true })
    const expected: (typeof legalMoves)[number] | undefined = legalMoves.find(
      ({ from, to }) =>
        from === transformSquare(sourceMove.from, transform) &&
        to === transformSquare(sourceMove.to, transform),
    )
    assert.ok(expected, transform.name)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — knight-step control',
      fen,
    )
  }
})

test('degenerate knight-step control rejects relative near misses', () => {
  for (const fen of [
    '6B1/6B1/8/8/5K1k/8/8/8 w - - 0 1',
    '6B1/8/6B1/8/5K2/7k/8/8 w - - 0 1',
  ]) {
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — knight-step control',
      fen,
    )
  }
})

test('degenerate wall waiting move preserves both corner-wall controls', () => {
  const source =
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateWallWaitingMove.fen
  const ruleSet = getMateRuleSet('two-bishops')
  const expectedSans = [
    'Be6',
    'Bd5',
    'Bc4',
    'Bb3',
    'Ba2',
    'Be5',
    'Bd4',
    'Bc3',
    'Bb2',
    'Ba1',
  ]

  for (const san of expectedSans) {
    assert.equal(scoreTwoBishopsWhiteMove(source, san).degeneratePenalty, 0)
  }
  const sourceIdealMoves = ruleSet.idealWhiteMoves(source)
  assert.ok(sourceIdealMoves.length > 0)
  assert.ok(sourceIdealMoves.every((san) => expectedSans.includes(san)))
  assert.equal(scoreTwoBishopsWhiteMove(source, 'Ke6').degeneratePenalty, 1)
  assert.equal(
    getTwoBishopsDegenerateReasonLabel(source),
    'degenerate — wall waiting move',
  )
  assert.equal(ruleSet.currentWhiteHint(source)?.id, 'unclutter bishops')

  const sourceMoves = getChess(source).moves({ verbose: true })
  const expectedSourceMoves = sourceMoves.filter((move) =>
    expectedSans.includes(move.san),
  )
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const legalMoves = getChess(fen).moves({ verbose: true })
    const expected = expectedSourceMoves.map((sourceMove) => {
      const from = transformSquare(sourceMove.from, transform)
      const to = transformSquare(sourceMove.to, transform)
      const transformedMove = legalMoves.find(
        (move) => move.from === from && move.to === to,
      )
      assert.ok(transformedMove, `${transform.name}: ${sourceMove.san}`)
      return transformedMove.san
    })
    for (const san of expected) {
      assert.equal(
        scoreTwoBishopsWhiteMove(fen, san).degeneratePenalty,
        0,
        `${fen}: ${san}`,
      )
    }
    const idealMoves = ruleSet.idealWhiteMoves(fen)
    assert.ok(idealMoves.length > 0, fen)
    for (const san of idealMoves) {
      assert.ok(expected.includes(san), `${fen}: ${san}`)
    }
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — wall waiting move',
      fen,
    )
  }
})

test('degenerate wall waiting move rejects translations and nearby arrangements', () => {
  for (const fen of [
    '8/8/5B1k/5B2/5K2/8/8/8 w - - 0 1',
    '8/5B2/5B1k/5K2/8/8/8/8 w - - 0 1',
    '8/4B2k/5B2/5K2/8/8/8/8 w - - 0 1',
  ]) {
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — wall waiting move',
      fen,
    )
  }
})

test('degenerate corner diagonals preserves completed controls and cascades', () => {
  const source = '8/7k/5K2/8/1B6/8/4B3/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const from = transformSquare('f6', transform)
    const target = transformSquare('f7', transform)
    const expected = getChess(fen)
      .moves({ verbose: true })
      .find(
        (move) =>
          move.piece === 'k' &&
          move.from === from &&
          move.to === target,
      )
    assert.ok(expected, fen)
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, expected.san).degeneratePenalty,
      0,
      fen,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, expected.san).forcePhaseTwoPenalty,
      0,
      fen,
    )
    assert.ok(ruleSet.currentWhiteHint(fen), fen)
    for (const san of ruleSet.idealWhiteMoves(fen)) {
      const score = scoreTwoBishopsWhiteMove(fen, san)
      assert.equal(score.degeneratePenalty, 0, `${fen}: ${san}`)
      assert.equal(score.forcePhaseTwoPenalty, 0, `${fen}: ${san}`)
    }
  }

  assert.equal(scoreTwoBishopsWhiteMove(source, 'Ke7').degeneratePenalty, 1)
})

test('degenerate corner diagonals rejects translations and a missing f8 line', () => {
  for (const fen of [
    '8/B5k1/4K3/8/B7/8/8/8 w - - 0 1',
    '8/1B5k/5K2/8/B7/8/8/8 w - - 0 1',
  ]) {
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — corner diagonals',
      fen,
    )
  }
})

test('the removed bishop advance position cascades to bishops off edge', () => {
  const fen = '8/6B1/6B1/8/7k/5K2/8/8 w - - 6 4'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(getTwoBishopsDegenerateReasonLabel(fen), undefined)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bf6+'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'bishops off edge')
})

test('degenerate long diagonal excludes the edge endpoint', () => {
  const fen = TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateLongDiagonal.fen
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(
    getTwoBishopsDegenerateReasonLabel(fen),
    'degenerate — long diagonal',
  )
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), [
    'Be3',
    'Bd4',
    'Bc5',
    'Bb6',
  ])
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Ba7'), false)
})

test('degenerate long diagonal accepts the supplied second-bishop placement', () => {
  const fen = '8/8/8/1B6/8/5K2/5B2/7k w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(
    getTwoBishopsDegenerateReasonLabel(fen),
    'degenerate — long diagonal',
  )
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), [
    'Be3',
    'Bd4',
    'Bc5',
    'Bb6',
  ])
})

test('degenerate long diagonal keeps the legal subset when blocked', () => {
  const fen = '8/8/8/8/3B4/5K2/5B2/7k w - - 0 1'
  assert.equal(
    getTwoBishopsDegenerateReasonLabel(fen),
    'degenerate — long diagonal',
  )
  assert.deepEqual(getMateRuleSet('two-bishops').idealWhiteMoves(fen), [
    'Bfe3',
  ])
})

test('degenerate long diagonal accepts h-file squares at Phase 2 distance', () => {
  const phaseTwoPositions = [
    '8/8/8/8/8/5K2/B4B2/7k w - - 0 1',
    '8/8/8/8/8/5K2/B4B1k/8 w - - 0 1',
    '8/8/8/8/8/5K1k/B4B2/8 w - - 0 1',
    '8/8/8/7k/8/5K2/5B2/1B6 w - - 0 1',
  ]
  for (const fen of phaseTwoPositions) {
    assert.equal(isTwoBishopsPhaseTwoPosition(fen), true, fen)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — long diagonal',
      fen,
    )
  }

  for (const fen of [
    '4B3/7k/8/8/8/5K2/5B2/8 w - - 0 1',
    '7k/8/8/8/8/5K2/B4B2/8 w - - 0 1',
  ]) {
    assert.equal(isTwoBishopsPhaseTwoPosition(fen), false, fen)
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — long diagonal',
      fen,
    )
  }
})

test('degenerate long diagonal follows D4 symmetry', () => {
  const source = '8/8/8/1B6/8/5K2/5B2/7k w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const sourceTargets = ['e3', 'd4', 'c5', 'b6'] as const

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const expectedTargets = new Set(
      sourceTargets.map((square) => transformSquare(square, transform)),
    )
    const expected = getChess(fen)
      .moves({ verbose: true })
      .filter(
        (move) =>
          move.from === transformSquare('f2', transform) &&
          expectedTargets.has(move.to),
      )
      .map(({ san }) => san)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), expected, fen)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — long diagonal',
      fen,
    )
  }
})

test('degenerate long diagonal rejects translated and nearby arrangements', () => {
  const translated = new Chess()
  translated.clear()
  assert.equal(translated.put({ color: 'w', type: 'k' }, 'f4'), true)
  assert.equal(translated.put({ color: 'b', type: 'k' }, 'h2'), true)
  assert.equal(translated.put({ color: 'w', type: 'b' }, 'f3'), true)
  assert.equal(translated.put({ color: 'w', type: 'b' }, 'e7'), true)

  for (const fen of [
    translated.fen(),
    '8/8/4B3/8/8/5K2/4B2k/8 w - - 0 1',
    '8/8/8/1B5k/8/5K2/5B2/8 w - - 0 1',
  ]) {
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — long diagonal',
      fen,
    )
  }
})

test('degenerate king lift follows board-wide D4 transforms', () => {
  const source = kingLiftFen('h1')
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const from = transformSquare('f3', transform)
    const target = transformSquare('g3', transform)
    const expected = getChess(fen)
      .moves({ verbose: true })
      .find(
        (move) =>
          move.piece === 'k' &&
          move.from === from &&
          move.to === target,
      )
    assert.ok(expected, fen)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — king lift',
      fen,
    )
  }
})

test('degenerate king lift rejects translations and near misses', () => {
  const translated = new Chess()
  translated.clear()
  assert.equal(translated.put({ color: 'w', type: 'k' }, 'f4'), true)
  assert.equal(translated.put({ color: 'b', type: 'k' }, 'g2'), true)
  assert.equal(translated.put({ color: 'w', type: 'b' }, 'd3'), true)
  assert.equal(translated.put({ color: 'w', type: 'b' }, 'f6'), true)

  for (const fen of [
    translated.fen(),
    kingLiftFen('g1', 'a3'),
    kingLiftFen('g1', 'd2', 'f5', 'g3'),
  ]) {
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — king lift',
      fen,
    )
  }
})

test('degenerate diagram order puts edge unmask before king lift', () => {
  const fen = '2B5/8/8/8/8/8/5K2/4B2k w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.equal(ruleSet.phase(fen), '2/2')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bd2'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bd2').degeneratePenalty, 0)
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'degenerate')
  assert.equal(
    getTwoBishopsDegenerateReasonLabel(fen),
    'degenerate — unmask edge bishop',
  )
})

test('degenerate phase 1 loop escape uniquely selects Bf3', () => {
  const source =
    TWO_BISHOPS_DIAGRAM_POSITIONS.degeneratePhaseOneLoopEscape.fen
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(source), '1/2')
  assert.deepEqual(ruleSet.idealWhiteMoves(source), ['Bf3'])
  assert.equal(scoreTwoBishopsWhiteMove(source, 'Bf3').degenerateApplies, true)
  assert.equal(scoreTwoBishopsWhiteMove(source, 'Bf3').degeneratePenalty, 0)
  assert.equal(
    ruleSet.currentWhiteHint(source)?.shortLabel,
    'degenerate — phase 1 loop escape',
  )
  assert.equal(
    getTwoBishopsDegenerateReasonLabel(source),
    'degenerate — phase 1 loop escape',
  )

  const afterWhite = getChess(source)
  afterWhite.move('Bf3')
  assert.equal(ruleSet.phase(afterWhite.fen()), '1/2')
  assert.deepEqual(ruleSet.blackCandidates(afterWhite.fen(), source).idealMoves, [
    'Kb4',
  ])
})

test('degenerate phase 1 loop escape follows every D4 transform', () => {
  const source =
    TWO_BISHOPS_DIAGRAM_POSITIONS.degeneratePhaseOneLoopEscape.fen
  const sourceMove = getChess(source).move('Bf3')
  assert.ok(sourceMove)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const expected = getChess(fen)
      .moves({ verbose: true })
      .find(
        ({ from, to }) =>
          from === transformSquare(sourceMove.from, transform) &&
          to === transformSquare(sourceMove.to, transform),
      )
    assert.ok(expected, transform.name)
    assert.equal(ruleSet.phase(fen), '1/2', transform.name)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], transform.name)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — phase 1 loop escape',
      transform.name,
    )
  }
})

test('degenerate phase 1 loop escape rejects translations and nearby geometry', () => {
  for (const fen of [
    '1B6/1B6/8/2k5/4K3/8/8/8 w - - 0 1',
    'B7/B7/8/1k6/8/3K4/8/8 w - - 0 1',
  ]) {
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — phase 1 loop escape',
      fen,
    )
  }
})

test('degenerate king flank selects Kf6 in the supplied Phase 1 position', () => {
  const fen = '8/3k4/8/4K3/4BB2/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kf6'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kf6').degenerateApplies, true)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kf6').degeneratePenalty, 0)
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'degenerate')
  assert.equal(
    getTwoBishopsDegenerateReasonLabel(fen),
    'degenerate — king flank',
  )
})

test('degenerate king flank follows translation and every D4 transform', () => {
  const source = '8/3k4/8/4K3/4BB2/8/8/8 w - - 0 1'
  const sourceMove = getChess(source).move('Kf6')
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
    assert.equal(ruleSet.phase(fen), '1/2', transform.name)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [move.san], transform.name)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — king flank',
      transform.name,
    )
  }

  const translated = '8/2k5/8/3K4/3BB3/8/8/8 w - - 0 1'
  assert.equal(ruleSet.phase(translated), '1/2')
  assert.deepEqual(ruleSet.idealWhiteMoves(translated), ['Ke6'])
  assert.equal(
    getTwoBishopsDegenerateReasonLabel(translated),
    'degenerate — king flank',
  )
})

test('degenerate king flank rejects nearby geometry and is inactive in Phase 2', () => {
  const nearby = '8/2k5/8/4K3/4BB2/8/8/8 w - - 0 1'
  assert.equal(scoreTwoBishopsWhiteMove(nearby, 'Kf6').degenerateApplies, false)
  assert.notEqual(
    getTwoBishopsDegenerateReasonLabel(nearby),
    'degenerate — king flank',
  )

  const phaseTwo = '8/k7/8/1K6/1BB5/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.equal(ruleSet.phase(phaseTwo), '2/2')
  assert.equal(scoreTwoBishopsWhiteMove(phaseTwo, 'Kc6').degenerateApplies, false)
  assert.notEqual(
    getTwoBishopsDegenerateReasonLabel(phaseTwo),
    'degenerate — king flank',
  )
})

test('degenerate sidesteps the king away from the relative bishop wall', () => {
  const source = '8/8/8/4BB2/5K2/8/5k2/8 w - - 32 17'
  const translated = '8/8/2BB4/3K4/8/3k4/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(source), '1/2')
  assert.deepEqual(ruleSet.idealWhiteMoves(source), ['Kg4'])
  assert.equal(scoreTwoBishopsWhiteMove(source, 'Kg4').degenerateApplies, true)
  assert.equal(scoreTwoBishopsWhiteMove(source, 'Kg4').degeneratePenalty, 0)
  assert.equal(ruleSet.currentWhiteHint(source)?.id, 'degenerate')
  assert.equal(ruleSet.idealWhiteMoves(source).includes('Ke4'), false)

  assert.equal(ruleSet.phase(translated), '1/2')
  assert.deepEqual(ruleSet.idealWhiteMoves(translated), ['Ke5'])

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const whiteKing = findPiece(fen, 'w', 'k')?.square
    const target = transformSquare('g4', transform)
    assert.ok(whiteKing)
    const expected = getChess(fen)
      .moves({ verbose: true })
      .find(
        (move) =>
          move.piece === 'k' &&
          move.from === whiteKing &&
          move.to === target,
      )
    assert.ok(expected, fen)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, expected.san).degeneratePenalty,
      0,
      fen,
    )
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'degenerate', fen)
  }
})

test('degenerate reforms the relative bishop wall with Bf4', () => {
  const source = '8/8/8/4BB2/6K1/8/4k3/8 w - - 34 18'
  const translated = '8/8/2BB4/4K3/8/2k5/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(source), '1/2')
  assert.deepEqual(ruleSet.idealWhiteMoves(source), ['Bf4'])
  assert.equal(scoreTwoBishopsWhiteMove(source, 'Bf4').degenerateApplies, true)
  assert.equal(scoreTwoBishopsWhiteMove(source, 'Bf4').degeneratePenalty, 0)
  assert.equal(ruleSet.currentWhiteHint(source)?.id, 'degenerate')

  assert.equal(ruleSet.phase(translated), '1/2')
  assert.deepEqual(ruleSet.idealWhiteMoves(translated), ['Bd5'])

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const from = transformSquare('e5', transform)
    const target = transformSquare('f4', transform)
    const expected = getChess(fen)
      .moves({ verbose: true })
      .find(
        (move) =>
          move.piece === 'b' &&
          move.from === from &&
          move.to === target,
      )
    assert.ok(expected, fen)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, expected.san).degeneratePenalty,
      0,
      fen,
    )
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'degenerate', fen)
  }
})

test('degenerate bishop reform rejects nearby relative geometry', () => {
  const fen = '8/8/8/3B1B2/6K1/8/4k3/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.equal(ruleSet.phase(fen), '1/2')
  for (const san of getChess(fen).moves()) {
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, san).degenerateApplies,
      false,
      san,
    )
  }
})

test('degenerate king sidestep rejects nearby geometry and an off-board target', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const nearby = '8/8/8/3B1B2/5K2/8/5k2/8 w - - 0 1'
  assert.equal(ruleSet.phase(nearby), '1/2')
  assert.equal(scoreTwoBishopsWhiteMove(nearby, 'Kg4').degenerateApplies, false)

  const offBoardTarget = '8/8/8/6BB/7K/8/7k/8 w - - 0 1'
  for (const san of getChess(offBoardTarget).moves()) {
    assert.equal(
      scoreTwoBishopsWhiteMove(offBoardTarget, san).degenerateApplies,
      false,
      san,
    )
  }
})

test('degenerate edge repair selects Bd2 whenever it is the first matching repair', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const edgeSquares = ['h1', 'h2', 'h3', 'h4'] as const
  const controllingDiagonal = ['d1', 'e2', 'f3', 'g4', 'h5'] as const
  const coveredEdgeSquares = new Set<Square>()
  const coveredControllingSquares = new Set<Square>()

  for (const blackKing of edgeSquares) {
    for (const controllingBishop of controllingDiagonal) {
      const source = edgeRepairFen(blackKing, controllingBishop)
      if (!validateMatePosition('two-bishops', source).ok) continue
      if (ruleSet.phase(source) !== '2/2') continue
      if (
        getTwoBishopsDegenerateReasonLabel(source) !==
        'degenerate — edge repair'
      ) {
        continue
      }
      coveredEdgeSquares.add(blackKing)
      coveredControllingSquares.add(controllingBishop)
      const repair = scoreTwoBishopsWhiteMove(source, 'Bd2')
      assert.equal(repair.degenerateApplies, true, source)
      assert.equal(repair.degeneratePenalty, 0, source)
    }
  }
  assert.ok(coveredEdgeSquares.size > 0)
  assert.ok(coveredControllingSquares.size > 0)

  const source = edgeRepairFen('h3', 'd1')
  assert.deepEqual(ruleSet.idealWhiteMoves(source), ['Bd2'])
  assert.equal(ruleSet.currentWhiteHint(source)?.id, 'degenerate')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const repairMoves = getChess(fen)
      .moves()
      .filter(
        (san) => scoreTwoBishopsWhiteMove(fen, san).degeneratePenalty === 0,
      )
    assert.equal(repairMoves.length, 1, fen)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), repairMoves, fen)
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'degenerate', fen)
  }
})

test('degenerate unmasks the edge bishop across the five approved king squares', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const cases = [
    ['h1', '2/2'],
    ['h2', '2/2'],
    ['h3', '2/2'],
    ['h4', '1/2'],
    ['g4', '1/2'],
  ] as const
  for (const [blackKing, phase] of cases) {
    const fen = edgeRepairFen(blackKing, 'c2')
    assert.equal(ruleSet.phase(fen), phase, fen)
    const expectedMove = 'Bd2'
    const expectedReason = 'degenerate — unmask edge bishop'
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expectedMove], fen)
    const repair = scoreTwoBishopsWhiteMove(fen, expectedMove)
    assert.equal(repair.degenerateApplies, true, fen)
    assert.equal(repair.degeneratePenalty, 0, fen)
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'degenerate', fen)
    assert.equal(getTwoBishopsDegenerateReasonLabel(fen), expectedReason, fen)
  }

  const source = edgeRepairFen('h3', 'c2')
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const from = transformSquare('e1', transform)
    const target = transformSquare('d2', transform)
    const expected = getChess(fen)
      .moves({ verbose: true })
      .find(
        (move) =>
          move.piece === 'b' &&
          move.from === from &&
          move.to === target,
      )
    assert.ok(expected, fen)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'degenerate', fen)
  }
})

test('degenerate edge unmask rejects nearby geometry and a blocked target', () => {
  const nearby = '8/8/8/8/8/5K1k/2B5/4B3 w - - 0 1'
  for (const san of getChess(nearby).moves()) {
    assert.equal(
      scoreTwoBishopsWhiteMove(nearby, san).degenerateApplies,
      false,
      san,
    )
  }

  const blockedTarget = edgeRepairFen('h3', 'd2')
  for (const san of getChess(blockedTarget).moves()) {
    assert.equal(
      scoreTwoBishopsWhiteMove(blockedTarget, san).degenerateApplies,
      false,
      san,
    )
  }
})

test('the removed diagonal king step position cascades', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const fen = '4B3/8/5B1k/5K2/8/8/8/8 w - - 2 2'

  assert.equal(getTwoBishopsDegenerateReasonLabel(fen), undefined)
  assert.notEqual(ruleSet.currentWhiteHint(fen)?.id, 'degenerate')
})

test('degenerate diagonal setup accepts Black on h5 or h6 and follows D4 symmetry', () => {
  const sources = [
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateDiagonalSetup.fen,
    '8/4B3/5K1k/8/8/8/2B5/8 w - - 0 1',
  ] as const
  const ruleSet = getMateRuleSet('two-bishops')

  for (const source of sources) {
    assert.equal(ruleSet.phase(source), '2/2', source)
    assert.equal(
      getTwoBishopsDegenerateReasonLabel(source),
      'degenerate — diagonal setup',
      source,
    )
    assert.deepEqual(ruleSet.currentWhiteHint(source), {
      id: 'degenerate',
      shortLabel: 'degenerate — diagonal setup',
      helpText: 'repair degenerate positions',
    })

    for (const transform of SQUARE_TRANSFORMS) {
      const fen = getChess(transformFen(source, transform)).fen()
      const from = transformSquare('c2', transform)
      const target = transformSquare('f5', transform)
      const expected = getChess(fen)
        .moves({ verbose: true })
        .find(
          (move) =>
            move.piece === 'b' &&
            move.from === from &&
            move.to === target,
        )
      assert.ok(expected, fen)
      assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
      assert.equal(
        getTwoBishopsDegenerateReasonLabel(fen),
        'degenerate — diagonal setup',
        fen,
      )
    }
  }

  for (const [fen, san] of [
    ['8/8/4B3/5K2/7k/8/8/2B5 w - - 0 1', 'Bf4'],
    ['4B3/5K2/7k/8/8/2B5/8/8 w - - 0 1', 'Bd7'],
  ] as const) {
    assert.equal(ruleSet.phase(fen), '2/2', fen)
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [san], fen)
    assert.ok(getTwoBishopsDegenerateReasonLabel(fen)?.startsWith('degenerate —'))
  }
})

test('degenerate diagonal setup rejects relative and blocked-path near misses', () => {
  for (const fen of [
    '3B4/8/5K2/7k/8/8/2B5/8 w - - 0 1',
    '8/4B3/5K2/7k/8/3p4/2B5/8 w - - 0 1',
  ]) {
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — diagonal setup',
      fen,
    )
  }
})

test('degenerate diagonal waiting move owns its position', () => {
  const source = '4B1k1/8/4KB2/8/8/8/8/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.deepEqual(ruleSet.idealWhiteMoves(source), ['Bh5'])
  assert.equal(
    ruleSet.currentWhiteHint(source)?.shortLabel,
    'degenerate — diagonal waiting move',
  )
})

test('degenerate diagonal waiting move rejects translations and a bishop off e8', () => {
  for (const fen of [
    '8/4B1k1/8/4KB2/8/8/8/8 w - - 0 1',
    '6k1/5B2/4KB2/8/8/8/8/8 w - - 0 1',
  ]) {
    assert.notEqual(
      getTwoBishopsDegenerateReasonLabel(fen),
      'degenerate — diagonal waiting move',
      fen,
    )
  }
})

test('every selected degenerate reason has a matching diagram title', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const diagramTitles = new Set(
    ruleSet.help.noteBoards.map(({ title }) => title),
  )
  const cases = [
    TWO_BISHOPS_DIAGRAM_POSITIONS.degeneratePhaseTwoOpposition.fen,
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateMateInFour.fen,
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKnightStepControl.fen,
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateWallWaitingMove.fen,
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateCornerDiagonals.fen,
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateXx.fen,
    kingLiftFen('h1'),
    edgeRepairFen('h3', 'd1'),
    edgeRepairFen('h3', 'c2'),
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateDiagonalSetup.fen,
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateDiagonalWaitingMove.fen,
    '2B5/8/8/8/8/4B3/5K2/7k w - - 0 1',
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateWaitingMove.fen,
    TWO_BISHOPS_DIAGRAM_POSITIONS.degeneratePhaseOneLoopEscape.fen,
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKingSidestep.fen,
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateReformWall.fen,
  ] as const

  for (const fen of cases) {
    const reason = getTwoBishopsDegenerateReasonLabel(fen)
    assert.ok(reason, fen)
    assert.equal(diagramTitles.has(reason), true, `${fen}: ${reason}`)
  }
})

test('mate in 3 follows stalemate safety', () => {
  const fen = '5B1k/1B3K2/8/8/8/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.equal(ruleSet.phase(fen), '2/2')
  assert.equal(ruleSet.idealWhiteMoves(fen).includes('Be4'), false)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Be4').stalematePenalty, 1)
  assert.ok(
    ruleSet
      .idealWhiteMoves(fen)
      .every(
        (san) => scoreTwoBishopsWhiteMove(fen, san).mateInThreeTurns === 3,
      ),
  )
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'unclutter bishops')
})

test('mate in 3 owns the supplied corner position', () => {
  const fen = '8/8/8/8/8/8/3B1K2/5B1k w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf4').stalematePenalty, 1)
  assert.ok(
    ruleSet
      .idealWhiteMoves(fen)
      .every(
        (san) => scoreTwoBishopsWhiteMove(fen, san).mateInThreeTurns === 3,
      ),
  )
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'unclutter bishops')
})

test('mate in 3 chooses forced three-move keys in the corner position', () => {
  const fen = '8/3B4/8/8/7B/8/5K2/7k w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.equal(ruleSet.phase(fen), '2/2')
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bc8').mateInThreeTurns, 3)
  const bestTurns = Math.min(
    ...ruleSet
      .idealWhiteMoves(fen)
      .map((san) => scoreTwoBishopsWhiteMove(fen, san).mateInThreeTurns),
  )
  for (const san of ruleSet.idealWhiteMoves(fen)) {
    const score = scoreTwoBishopsWhiteMove(fen, san)
    assert.equal(score.mateInThreeApplies, true, san)
    assert.equal(score.mateInThreeTurns, bestTurns, san)
    assert.ok(score.mateInThreeTurns <= 3, san)
  }
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'unclutter bishops')

  const line = getChess(fen)
  line.move('Bc8')
  assert.equal(line.isCheck(), false)
  assert.deepEqual(line.moves(), ['Kh2'])
  line.move('Kh2')
  assert.deepEqual(ruleSet.idealWhiteMoves(line.fen()), ['Bg3+'])
  line.move('Bg3+')
  assert.deepEqual(line.moves(), ['Kh1'])
  line.move('Kh1')
  assert.deepEqual(ruleSet.idealWhiteMoves(line.fen()), ['Bb7#'])

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
    const moves = ruleSet.idealWhiteMoves(transformedFen)
    assert.ok(moves.length > 0, transformedFen)
    for (const san of moves) {
      assert.equal(
        scoreTwoBishopsWhiteMove(transformedFen, san).mateInThreeTurns,
        3,
        `${transformedFen}: ${san}`,
      )
    }
    assert.equal(
      ruleSet.currentWhiteHint(transformedFen)?.id,
      'unclutter bishops',
      transformedFen,
    )
  }
})

test('mate in 3 pattern matching has no phase gate', () => {
  const source = readFileSync(new URL('./twoBishops.ts', import.meta.url), 'utf8')
  const matcherStart = source.indexOf('function getMatePatternTurnsBySan(')
  const matcherEnd = source.indexOf(
    'type TwoBishopsWhitePositionContext',
    matcherStart,
  )
  assert.ok(matcherStart >= 0)
  assert.ok(matcherEnd > matcherStart)
  assert.doesNotMatch(source.slice(matcherStart, matcherEnd), /isPhaseTwo/)
})

test('mate in 3 outranks an overlapping degenerate waiting move', () => {
  const fen = '8/8/8/6B1/8/8/5K2/5B1k w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(
    getTwoBishopsDegenerateReasonLabel(fen),
    'degenerate — waiting move',
  )
  const ideals = ruleSet.idealWhiteMoves(fen)
  assert.ok(ideals.length > 0)
  assert.ok(
    ideals.every(
      (san) => scoreTwoBishopsWhiteMove(fen, san).mateInThreeTurns === 3,
    ),
  )
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'unclutter bishops')
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bd8').degeneratePenalty, 0)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf6').mateInThreeTurns, 3)

  const line = getChess(fen)
  line.move('Bf6')
  line.move('Kh2')
  line.move('Be5+')
  line.move('Kh1')
  assert.ok(ruleSet.idealWhiteMoves(line.fen()).includes('Bg2#'))
})

test('mate in 3 retains the former mate-in-two opposition setup', () => {
  const fen = '2B5/8/8/8/7B/8/5K1k/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.equal(ruleSet.phase(fen), '2/2')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bg3+'])
  const score = scoreTwoBishopsWhiteMove(fen, 'Bg3+')
  assert.equal(score.mateInThreeApplies, true)
  assert.equal(score.mateInThreeTurns, 2)
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'mate in 3')

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = getChess(transformFen(fen, transform)).fen()
    const moves = ruleSet.idealWhiteMoves(transformedFen)
    assert.equal(moves.length, 1, transformedFen)
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, moves[0]!).mateInThreeTurns,
      2,
      transformedFen,
    )
    assert.equal(
      ruleSet.currentWhiteHint(transformedFen)?.id,
      'mate in 3',
      transformedFen,
    )
  }
})

test('mate in 3 uses the restored edge mating position', () => {
  const fen = '5K2/7k/8/3B4/5B2/8/8/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Be4+'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Be4+').mateInThreeTurns, 2)
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'mate in 3')
})

test('mate in 3 accepts the corner edge mating square', () => {
  const fen = '5K1k/8/8/8/8/B7/B7/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bc1'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bc1').mateInThreeTurns, 3)
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'mate in 3')
})

test('mate in 3 ignores a king setup without the exact mating pattern', () => {
  const fen = '1k6/4B3/1KB5/8/8/8/8/8 w - - 48 25'
  const ruleSet = getMateRuleSet('two-bishops')
  const scored = twoBishopsRuleSet.scoreWhiteCandidates?.(
    fen,
    getChess(fen).moves(),
  )
  assert.ok(scored)
  assert.ok(scored.every(({ score }) => !score.mateInThreeApplies))
  assert.notEqual(ruleSet.currentWhiteHint(fen)?.id, 'mate in 3')
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

test('Two Bishops keeps its phase explanation and diagram', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(ruleSet.help.notes, [
    "Phase 2: Black's king forced to the edge, White's king two steps away from Black's king.",
    "Phase 2 Target Corner: Calculate after White's move in Phase 2. If Black is in or one edge square from a corner, use that corner. Otherwise, in the corner-diagonals position, its cutoff points to the opposite corner and continues to do so when Black steps around that corner. Otherwise, when the kings are in opposition and more bishops stand on one physical side of White's king, choose the opposite corner. When deciding between bishop moves, prefer the stronger bishop majority. Otherwise, choose the corner where White wins the king race by the greatest Chebyshev-distance lead. If neither method decides, choose the corner closest to White's king. Retain tied corners.",
    "Phase 1 Target Square: It's the square adjacent to Black's king furthest from the corner closest to Black's king.",
  ])
  assert.deepEqual(ruleSet.help.noteBoards.map(({ id }) => id), [
    'bishop-degenerate-phase-two-opposition',
    'bishop-degenerate-ignore-light-bishop',
    'bishop-degenerate-mate-in-four',
    'bishop-degenerate-knight-step-control',
    'bishop-degenerate-wall-waiting-move',
    'bishop-degenerate-corner-diagonals',
    'bishop-degenerate-xx',
    'bishop-degenerate-edge-repair',
    'bishop-degenerate-edge-unmask',
    'bishop-degenerate-diagonal-setup',
    'bishop-degenerate-diagonal-waiting-move',
    'bishop-degenerate-free-bishop',
    'bishop-degenerate-waiting-move',
    'bishop-degenerate-phase-one-loop-escape',
    'bishop-degenerate-king-flank',
    'bishop-degenerate-king-sidestep',
    'bishop-degenerate-reform-wall',
    'bishop-degenerate-king-lift',
    'bishop-degenerate-bishop-retreat',
    'bishop-degenerate-long-diagonal',
    'bishop-degenerate-mate-prep',
    'bishop-mating-position',
    'bishop-shepherd',
    'bishop-phase-two-wall',
    'bishop-proximate-wall',
  ])
  assert.deepEqual(
    ruleSet.help.noteBoards
      .slice(0, TWO_BISHOPS_DEGENERATE_PRIORITY_ORDER.length)
      .map(({ title }) => title),
    TWO_BISHOPS_DEGENERATE_PRIORITY_ORDER,
  )
  const phaseTwoOppositionBoard = ruleSet.help.noteBoards[0]!
  assert.deepEqual(phaseTwoOppositionBoard.arrows, [
    { from: 'e6', to: 'f6' },
  ])
  assert.equal(
    phaseTwoOppositionBoard.caption,
    'Take opposition with the king.',
  )
  const ignoreLightBishopBoard = ruleSet.help.noteBoards[1]!
  assert.deepEqual(ignoreLightBishopBoard.arrows, [
    { from: 'g7', to: 'h6' },
  ])
  assert.equal(
    ignoreLightBishopBoard.caption,
    "Ignore the light-squared bishop's location. Move the dark-squared bishop to h6.",
  )
  const xxBoard = ruleSet.help.noteBoards.find(
    ({ id }) => id === 'bishop-degenerate-xx',
  )!
  assert.deepEqual(xxBoard.highlights, [{ square: 'h6', kind: 'zone' }])
  assert.deepEqual(xxBoard.arrows, [{ from: 'b4', to: 'd2' }])
  assert.equal(xxBoard.caption, 'Control h6 with the dark-squared bishop.')
  const matePrepBoard = ruleSet.help.noteBoards.find(
    ({ id }) => id === 'bishop-degenerate-mate-prep',
  )!
  assert.deepEqual(matePrepBoard.arrows, [{ from: 'f3', to: 'f2' }])
  assert.equal(matePrepBoard.caption, 'Take opposition with the king.')
  const mateInFourBoard = ruleSet.help.noteBoards[2]!
  assert.deepEqual(
    mateInFourBoard.highlights.map(({ square }) => square),
    ['a6'],
  )
  assert.deepEqual(mateInFourBoard.arrows, [{ from: 'c6', to: 'c7' }])
  const knightStepControlBoard = ruleSet.help.noteBoards[3]!
  assert.deepEqual(
    knightStepControlBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKnightStepControl.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  assert.deepEqual(
    knightStepControlBoard.highlights.map(({ square }) => square),
    ['h5', 'g2'],
  )
  assert.deepEqual(knightStepControlBoard.arrows, [
    { from: 'g8', to: 'd5' },
  ])
  const wallWaitingMoveBoard = ruleSet.help.noteBoards[4]!
  assert.deepEqual(
    wallWaitingMoveBoard.highlights.map(({ square }) => square),
    ['g8', 'h8'],
  )
  assert.deepEqual(wallWaitingMoveBoard.arrows, [
    { from: 'f6', to: 'e5' },
  ])
  const cornerDiagonalsBoard = ruleSet.help.noteBoards[5]!
  assert.deepEqual(
    cornerDiagonalsBoard.highlights.map(({ square }) => square),
    ['f8', 'h5', 'h6'],
  )
  assert.equal(
    cornerDiagonalsBoard.caption,
    "Preserve one bishop's control of f8 and the other's control of d1 h5 diagonal, or tighten the h5 cutoff by controlling h6. The cutoff still identifies h8 after Black steps around the corner.",
  )
  assert.deepEqual(cornerDiagonalsBoard.arrows, [
    { from: 'b7', to: 'f3' },
  ])
  const edgeRepairBoard = ruleSet.help.noteBoards[7]!
  assert.deepEqual(
    edgeRepairBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateEdgeRepair.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  assert.deepEqual(edgeRepairBoard.arrows, [{ from: 'e1', to: 'd2' }])
  const edgeUnmaskBoard = ruleSet.help.noteBoards[8]!
  assert.deepEqual(
    edgeUnmaskBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateEdgeUnmask.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  assert.deepEqual(edgeUnmaskBoard.arrows, [{ from: 'e1', to: 'd2' }])
  const diagonalSetupBoard = ruleSet.help.noteBoards[9]!
  assert.deepEqual(diagonalSetupBoard.arrows, [
    { from: 'c2', to: 'f5' },
  ])
  assert.deepEqual(
    diagonalSetupBoard.highlights.map(({ square }) => square),
    ['c8', 'd7', 'e6', 'f5', 'g4', 'h3'],
  )
  assert.deepEqual(
    ruleSet.idealWhiteMoves(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateDiagonalSetup.fen,
    ),
    ['Bf5'],
  )
  const diagonalWaitingBoard = ruleSet.help.noteBoards[10]!
  assert.deepEqual(diagonalWaitingBoard.arrows, [
    { from: 'e8', to: 'h5' },
  ])
  assert.deepEqual(
    ruleSet.idealWhiteMoves(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateDiagonalWaitingMove.fen,
    ),
    ['Bh5'],
  )
  assert.deepEqual(
    ruleSet.idealWhiteMoves(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateEdgeUnmask.fen,
    ),
    ['Bd2'],
  )
  assert.equal(
    ruleSet.currentWhiteHint(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateEdgeUnmask.fen,
    )?.id,
    'degenerate',
  )
  const freeBishopBoard = ruleSet.help.noteBoards[11]!
  assert.deepEqual(
    freeBishopBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateFreeBishop.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  const waitingMoveBoard = ruleSet.help.noteBoards[12]!
  assert.deepEqual(
    waitingMoveBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateWaitingMove.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  const kingFlankBoard = ruleSet.help.noteBoards[14]!
  assert.deepEqual(
    kingFlankBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKingFlank.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  assert.deepEqual(kingFlankBoard.arrows, [{ from: 'e5', to: 'f6' }])
  const kingSidestepBoard = ruleSet.help.noteBoards[15]!
  assert.deepEqual(
    kingSidestepBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKingSidestep.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  assert.deepEqual(kingSidestepBoard.arrows, [{ from: 'f4', to: 'g4' }])
  assert.deepEqual(
    ruleSet.idealWhiteMoves(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKingSidestep.fen,
    ),
    ['Kg4'],
  )
  assert.equal(
    ruleSet.currentWhiteHint(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKingSidestep.fen,
    )?.id,
    'degenerate',
  )
  const reformWallBoard = ruleSet.help.noteBoards[16]!
  assert.deepEqual(
    reformWallBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateReformWall.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  assert.deepEqual(reformWallBoard.arrows, [{ from: 'e5', to: 'f4' }])
  assert.deepEqual(
    ruleSet.idealWhiteMoves(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateReformWall.fen,
    ),
    ['Bf4'],
  )
  assert.equal(
    ruleSet.currentWhiteHint(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateReformWall.fen,
    )?.id,
    'degenerate',
  )
  const kingLiftBoard = ruleSet.help.noteBoards[17]!
  assert.deepEqual(
    kingLiftBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKingLift.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  assert.deepEqual(kingLiftBoard.arrows, [{ from: 'f3', to: 'g3' }])
  assert.deepEqual(
    ruleSet.idealWhiteMoves(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKingLift.fen,
    ),
    ['Kg3'],
  )
  assert.equal(
    ruleSet.currentWhiteHint(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKingLift.fen,
    )?.shortLabel,
    'degenerate — king lift',
  )
  const bishopRetreatBoard = ruleSet.help.noteBoards[18]!
  assert.deepEqual(
    bishopRetreatBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateBishopRetreat.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  assert.deepEqual(bishopRetreatBoard.arrows, [{ from: 'f7', to: 'e8' }])
  const longDiagonalBoard = ruleSet.help.noteBoards[19]!
  assert.deepEqual(
    longDiagonalBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateLongDiagonal.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  assert.deepEqual(
    longDiagonalBoard.highlights.map(({ square }) => square),
    ['e3', 'd4', 'c5', 'b6'],
  )
  assert.equal(
    longDiagonalBoard.caption,
    "Move the bishop to any highlighted square. Don't move it to the edge.",
  )
  const matingPositionBoard = ruleSet.help.noteBoards[21]!
  assert.deepEqual(
    matingPositionBoard.pieces,
    TWO_BISHOPS_DIAGRAM_POSITIONS.matingPosition.pieces,
  )
  assert.deepEqual(
    matingPositionBoard.highlights.map(({ square }) => square),
    ['f8', 'f7'],
  )
  const shepherdBoard = ruleSet.help.noteBoards[22]!
  assert.deepEqual(
    shepherdBoard.highlights.map(({ square }) => square),
    ['a8', 'f8'],
  )
  assert.deepEqual(shepherdBoard.arrows, [{ from: 'e6', to: 'd6' }])
  assert.deepEqual(
    ruleSet.idealWhiteMoves(TWO_BISHOPS_DIAGRAM_POSITIONS.shepherd.fen),
    ['Kd6'],
  )
  assert.equal(
    ruleSet.currentWhiteHint(TWO_BISHOPS_DIAGRAM_POSITIONS.shepherd.fen)?.id,
    'shepherd',
  )
  const phaseTwoWallBoard = ruleSet.help.noteBoards[23]!
  assert.deepEqual(
    phaseTwoWallBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.phaseTwoWall.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  assert.deepEqual(
    phaseTwoWallBoard.highlights.map(({ square }) => square),
    ['b8', 'b7'],
  )
  const proximateWallBoard = ruleSet.help.noteBoards[24]!
  assert.deepEqual(
    proximateWallBoard.pieces,
    TWO_BISHOPS_DIAGRAM_POSITIONS.proximateWall.pieces,
  )
  assert.deepEqual(
    proximateWallBoard.highlights,
    TWO_BISHOPS_DIAGRAM_POSITIONS.proximateWall.highlights,
  )
  assert.deepEqual(
    proximateWallBoard.pieces.map(({ square }) => square),
    ['d4', 'd5'],
  )
  assert.deepEqual(
    proximateWallBoard.highlights.map(({ square }) => square),
    [
      'a3',
      'a4',
      'a5',
      'a6',
      'b4',
      'b5',
      'f4',
      'f5',
      'g3',
      'g4',
      'g5',
      'g6',
    ],
  )
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
