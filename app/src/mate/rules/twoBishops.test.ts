import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { Chess, type Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  squareCoordinates,
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
import { selectIdealMoves } from './selection'
import { TWO_BISHOPS_DIAGRAM_POSITIONS } from './twoBishopsDiagramPositions'

const WHITE_RULE_IDS = [
  'mate',
  'bishops safe',
  'no stalemate',
  'mate in 3',
  'degenerate',
  'force phase 2',
  'sequester',
  'bishops off edge',
  'bishops away',
  'phase 2 wall',
  'conclave step',
  'reverse conclave step',
  'martian conclave step',
  'finish wall',
  'start wall',
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
  const bestProgress = Math.min(
    ...moves.map(
      (san) => {
        const score = scoreTwoBishopsWhiteMove(fen, san)
        return (
          score.sequesterMaximumCornerReplyDistance -
          score.sequesterCurrentCornerDistance
        )
      },
    ),
  )
  const blackProgressMoves = moves.filter(
    (san) => {
      const score = scoreTwoBishopsWhiteMove(fen, san)
      return (
        score.sequesterMaximumCornerReplyDistance -
          score.sequesterCurrentCornerDistance ===
        bestProgress
      )
    },
  )
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
  return afterEdgeControl
}

function expectedAfterBishopsAway(fen: string, moves: string[]): string[] {
  const applicable = moves.filter((san) =>
    scoreTwoBishopsWhiteMove(fen, san).sequesterApplies,
  )
  if (applicable.length === 0) {
    return moves
  }
  const scores = applicable.map((san) =>
    scoreTwoBishopsWhiteMove(fen, san),
  )
  if (!scores.every((score) => score.sequesterIsBishopMove)) {
    return moves
  }
  const bestAlignment = Math.max(
    ...scores.map((score) => score.bishopsAwayCosineAlignment),
  )
  return moves.filter(
    (san) =>
      !scoreTwoBishopsWhiteMove(fen, san).sequesterApplies ||
      scoreTwoBishopsWhiteMove(fen, san).bishopsAwayCosineAlignment ===
        bestAlignment,
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
        shortLabel: 'sequester',
        helpText:
          "Phase 2: Force Black's king towards the target corner, or otherwise use a bishop to control the square 2 away from Black's current square.",
      },
      {
        shortLabel: 'bishops off edge',
        helpText: "Phase 2: Prefer fewer bishops on Black's edge.",
      },
      {
        shortLabel: 'bishops away',
        helpText:
          'Phase 2: Maximize cosine(edge, target corner, bishop) for each bishop.',
      },
      {
        shortLabel: 'phase 2 wall',
        helpText:
          "Phase 2: Create or maintain a 2 square wall adjacent to Black's king and opposite the target corner.",
      },
      {
        shortLabel: 'conclave step',
        helpText:
          'Phase 1: When the pieces are in the position shown, make the conclave step.',
      },
      {
        shortLabel: 'reverse conclave step',
        helpText:
          'Phase 1: When the pieces are in the position shown, make the reverse conclave step.',
      },
      {
        shortLabel: 'martian conclave step',
        helpText:
          "Phase 1: When the kings are two steps apart, control at least three squares adjacent to Black's king but not adjacent to White's king, preferring bishops close to each other.",
      },
      {
        shortLabel: 'finish wall',
        helpText:
          'Phase 1: When possible, create the closest proximate bishop wall.',
      },
      {
        shortLabel: 'start wall',
        helpText:
          "Phase 1: Place a bishop in two-square opposition to Black's king, preferring shorter bishop moves, and not increasing distance to Black's king",
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
      rule.id === 'conclave step' ||
      rule.id === 'reverse conclave step' ||
      rule.id === 'finish wall' ||
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
      assert.equal(rule.subpriorities?.length, 2)
    } else if (rule.id === 'bishops off edge') {
      assert.equal(typeof rule.applies, 'function')
      assert.equal(typeof rule.compare, 'function')
      assert.equal(rule.subpriorities, undefined)
    } else if (rule.id === 'bishops away') {
      assert.equal(typeof rule.applies, 'function')
      assert.equal(rule.compare, undefined)
      assert.equal(rule.subpriorities?.length, 1)
    } else if (rule.id === 'martian conclave step') {
      assert.equal(typeof rule.applies, 'function')
      assert.equal(rule.compare, undefined)
      assert.equal(rule.subpriorities?.length, 2)
    } else if (rule.id === 'start wall') {
      assert.equal(typeof rule.applies, 'function')
      assert.equal(rule.compare, undefined)
      assert.equal(rule.subpriorities?.length, 2)
    } else if (rule.id === 'phase 2 wall') {
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
    const afterSequester = expectedAfterSequester(fen, afterForcePhaseTwo)
    const afterBishopsOffEdge = expectedAfterBishopsOffEdge(
      fen,
      afterSequester,
    )
    const afterBishopsAway = expectedAfterBishopsAway(
      fen,
      afterBishopsOffEdge,
    )
    const afterPhaseTwoWall = expectedAfterPhaseTwoWall(
      fen,
      afterBishopsAway,
    )
    const phaseOneRulesApply = !afterPhaseTwoWall.some(
      (san) => scoreTwoBishopsWhiteMove(fen, san).isPhaseTwoPosition,
    )
    const conclaveMoves = phaseOneRulesApply
      ? afterPhaseTwoWall.filter(
          (san) =>
            scoreTwoBishopsWhiteMove(fen, san).conclaveStepPenalty === 0,
        )
      : []
    const afterConclave =
      conclaveMoves.length > 0 ? conclaveMoves : afterPhaseTwoWall
    const reverseConclaveMoves = phaseOneRulesApply
      ? afterConclave.filter(
          (san) =>
            scoreTwoBishopsWhiteMove(fen, san)
              .reverseConclaveStepPenalty === 0,
        )
      : []
    const afterReverseConclave =
      reverseConclaveMoves.length > 0
        ? reverseConclaveMoves
        : afterConclave
    const martianConclaveMoves = phaseOneRulesApply
      ? afterReverseConclave.filter(
          (san) =>
            scoreTwoBishopsWhiteMove(fen, san)
              .martianConclaveControlPenalty === 0,
        )
      : []
    const afterMartianControl =
      martianConclaveMoves.length > 0
        ? martianConclaveMoves
        : afterReverseConclave
    const bestMartianBishopDistance =
      martianConclaveMoves.length > 0
        ? Math.min(
            ...martianConclaveMoves.map(
              (san) =>
                scoreTwoBishopsWhiteMove(fen, san)
                  .martianConclaveBishopDistance,
            ),
          )
        : null
    const afterMartianConclave =
      bestMartianBishopDistance === null
        ? afterMartianControl
        : afterMartianControl.filter(
            (san) =>
              scoreTwoBishopsWhiteMove(fen, san)
                .martianConclaveBishopDistance ===
              bestMartianBishopDistance,
          )
    const bestFinishWallPenalty = phaseOneRulesApply
      ? Math.min(
          ...afterMartianConclave.map(
            (san) => scoreTwoBishopsWhiteMove(fen, san).finishWallPenalty,
          ),
        )
      : 99
    const finishWallMoves = afterMartianConclave.filter(
      (san) =>
        scoreTwoBishopsWhiteMove(fen, san).finishWallPenalty ===
        bestFinishWallPenalty,
    )
    const afterFinish =
      bestFinishWallPenalty < 99 ? finishWallMoves : afterMartianConclave
    const startWallMoves = phaseOneRulesApply
      ? afterFinish.filter(
          (san) => scoreTwoBishopsWhiteMove(fen, san).startWallPenalty === 0,
        )
      : []
    const shortestStartWallDistance =
      startWallMoves.length > 0
        ? Math.min(
            ...startWallMoves.map(
              (san) =>
                scoreTwoBishopsWhiteMove(fen, san)
                  .startWallMoveDistance!,
            ),
          )
        : null
    const expectedAfterWall =
      shortestStartWallDistance === null
        ? afterFinish
        : startWallMoves.filter(
            (san) =>
              scoreTwoBishopsWhiteMove(fen, san)
                .startWallMoveDistance === shortestStartWallDistance,
          )
    const bestPhaseTwoLinePenalty = Math.min(
      ...expectedAfterWall.map(
        (san) =>
          scoreTwoBishopsWhiteMove(fen, san)
            .kingCloserPhaseTwoLinePenalty,
      ),
    )
    const preferredLineMoves = expectedAfterWall.filter(
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
          'bishopsAwayCosineAlignment',
          'bishopsOnBlackEdgeCount',
          'checkPenalty',
          'conclaveStepPenalty',
          'degenerateApplies',
          'degeneratePenalty',
          'degenerateTerminal',
          'finishWallPenalty',
          'forcePhaseTwoApplies',
          'forcePhaseTwoPenalty',
          'isPhaseTwoPosition',
          'kingCloserDistance',
          'kingCloserMiddleSixteenDistance',
          'kingCloserPhaseTwoLinePenalty',
          'martianConclaveBishopDistance',
          'martianConclaveControlPenalty',
          'martianConclaveControlledRunLength',
          'mateInThreeApplies',
          'mateInThreeTurns',
          'matePenalty',
          'phaseTwoWallApplies',
          'phaseTwoWallPenalty',
          'reverseConclaveStepPenalty',
          'sequesterApplies',
          'sequesterCurrentCornerDistance',
          'sequesterHasTargetCorner',
          'sequesterIsBishopMove',
          'sequesterMaximumCornerReplyDistance',
          'sequesterTwoAwayControlPenalty',
          'stalematePenalty',
          'startWallMoveDistance',
          'startWallPenalty',
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

test('start wall remains active when an adjacent bishop wall is not proximate', () => {
  const fen = 'BB6/8/8/8/8/1K6/4k3/8 w - - 10 6'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Be5').startWallPenalty, 0)
  assert.ok(ruleSet.idealWhiteMoves(fen).includes('Be5'))
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'start wall')
})

test('start wall remains active for a remote adjacent wall', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const fen = '8/2BB4/2K5/8/8/8/5k2/8 w - - 0 1'
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf5').startWallPenalty, 0)
  assert.ok(ruleSet.idealWhiteMoves(fen).includes('Bf5'))
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'start wall')
})

test('start wall prefers the shorter move only among wall-starting bishops', () => {
  const fen = '8/3k4/8/5K2/8/4B3/1B6/8 w - - 0 1'
  const long = scoreTwoBishopsWhiteMove(fen, 'Bbd4')
  const short = scoreTwoBishopsWhiteMove(fen, 'Bed4')

  assert.equal(long.startWallPenalty, 0)
  assert.equal(short.startWallPenalty, 0)
  assert.equal(long.startWallMoveDistance, 2)
  assert.equal(short.startWallMoveDistance, 1)
  assert.deepEqual(getMateRuleSet('two-bishops').idealWhiteMoves(fen), ['Bed4'])
})

test('start wall rejects bishop moves that increase squared Euclidean distance', () => {
  const fen = '8/3k4/8/2B1K3/8/3B4/8/8 w - - 0 1'

  for (const san of ['Ba7', 'Bd4']) {
    const score = scoreTwoBishopsWhiteMove(fen, san)
    assert.equal(score.startWallPenalty, 1, san)
    assert.equal(score.startWallMoveDistance, null, san)
  }
})

test('start wall does not compare bishop distance when no wall is starting', () => {
  const fen = '8/8/8/5K1B/8/8/7k/4B3 w - - 0 1'
  const short = scoreTwoBishopsWhiteMove(fen, 'Bg6')
  const long = scoreTwoBishopsWhiteMove(fen, 'Be2')
  const startWall = twoBishopsWhiteRules.find(({ id }) => id === 'start wall')

  assert.equal(short.startWallPenalty, 1)
  assert.equal(long.startWallPenalty, 1)
  assert.equal(short.startWallMoveDistance, null)
  assert.equal(long.startWallMoveDistance, null)
  assert.equal(startWall?.subpriorities?.[1]?.when?.([short, long]), false)
})

test('finish wall selects Be5 when martian conclave is inactive', () => {
  const fen = '8/2B5/K7/5B2/8/4k3/8/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Be5'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Be5').finishWallPenalty, 0)
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'finish wall')
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

test('finish wall creates a proximate wall with Be6 or Bc6', () => {
  const fen = '8/3B4/3B4/8/3k2K1/8/8/8 w - - 32 17'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual([...ruleSet.idealWhiteMoves(fen)].sort(), ['Bc6', 'Be6'])
  for (const san of ['Bc6', 'Be6']) {
    assert.equal(scoreTwoBishopsWhiteMove(fen, san).finishWallPenalty, 0)
  }
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'finish wall')
})

test('start wall is already satisfied when either bishop holds its position', () => {
  const fen = '8/8/8/5K1B/8/8/7k/4B3 w - - 0 1'
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Be2').startWallPenalty, 1)
})

test('start wall is disabled when the bishops already have a proximate wall', () => {
  const fen = '8/8/2K5/4BB2/8/5k2/8/8 w - - 4 3'

  assert.notEqual(getProximateBishopWall(['e5', 'f5'], 'f3'), null)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bc3').startWallPenalty, 1)
})

test('start wall never selects when opposition already exists', () => {
  const source = '8/3B4/3B4/8/3k1K2/8/8/8 w - - 32 17'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    for (const san of getChess(fen).moves()) {
      assert.equal(
        scoreTwoBishopsWhiteMove(fen, san).startWallPenalty,
        1,
        `${transform.name} ${san}`,
      )
    }
  }
})

test('conclave step selects Be4 in the supplied arrangement', () => {
  const fen = '8/8/8/4BB2/8/3K4/5k2/8 w - - 16 9'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Be4'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Be4').conclaveStepPenalty, 0)
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'conclave step')
})

test('reverse conclave step selects Kd6 in the supplied arrangement', () => {
  const fen = '8/5k2/8/4K3/4BB2/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kd6'])
  assert.equal(
    scoreTwoBishopsWhiteMove(fen, 'Kd6').reverseConclaveStepPenalty,
    0,
  )
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'reverse conclave step')
})

test('reverse conclave step follows translation and every D4 transform', () => {
  const source = '8/5k2/8/4K3/4BB2/8/8/8 w - - 0 1'
  const sourceMove = getChess(source).move('Kd6')
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
      scoreTwoBishopsWhiteMove(fen, move.san).reverseConclaveStepPenalty,
      0,
      transform.name,
    )
    assert.equal(
      ruleSet.currentWhiteHint(fen)?.id,
      'reverse conclave step',
      transform.name,
    )
  }

  const translated = '8/8/4k3/8/3K4/3BB3/8/8 w - - 0 1'
  assert.equal(ruleSet.phase(translated), '1/2')
  assert.deepEqual(ruleSet.idealWhiteMoves(translated), ['Kc5'])
  assert.equal(
    scoreTwoBishopsWhiteMove(translated, 'Kc5').reverseConclaveStepPenalty,
    0,
  )
})

test('reverse conclave step rejects the earlier draft and is inactive in Phase 2', () => {
  const earlierDraft = '8/6k1/8/5K2/4BB2/8/8/8 w - - 0 1'
  assert.equal(
    scoreTwoBishopsWhiteMove(earlierDraft, 'Ke6')
      .reverseConclaveStepPenalty,
    1,
  )

  const phaseTwo = '7k/8/6K1/6BB/8/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.equal(ruleSet.phase(phaseTwo), '2/2')
  assert.notEqual(ruleSet.currentWhiteHint(phaseTwo)?.id, 'reverse conclave step')
})

test('martian conclave retains resulting configurations before king closer selects Bd3', () => {
  const fen = '8/8/2K1k3/8/3BB3/8/8/8 w - - 4 3'
  const ruleSet = getMateRuleSet('two-bishops')
  const martianIndex = twoBishopsWhiteRules.findIndex(
    ({ id }) => id === 'martian conclave step',
  )
  const scoredMoves = getChess(fen).moves().map((san) => ({
    san,
    score: scoreTwoBishopsWhiteMove(fen, san),
  }))

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.deepEqual(
    [...selectIdealMoves(
      scoredMoves,
      twoBishopsWhiteRules.slice(0, martianIndex + 1),
    )].sort(),
    ['Bd3', 'Kc5', 'Kc7'].sort(),
  )
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bd3'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'king closer')
})

test('martian conclave calculates king distance and controlled runs after White moves', () => {
  const fen = '8/8/2K1k3/8/3BB3/8/8/8 w - - 4 3'
  const kingCloser = scoreTwoBishopsWhiteMove(fen, 'Kc5')
  const kingAcross = scoreTwoBishopsWhiteMove(fen, 'Kc7')
  const kingAway = scoreTwoBishopsWhiteMove(fen, 'Kb7')
  const bishopStep = scoreTwoBishopsWhiteMove(fen, 'Bd3')

  assert.equal(kingCloser.martianConclaveControlledRunLength, 3)
  assert.equal(kingAcross.martianConclaveControlledRunLength, 4)
  assert.equal(bishopStep.martianConclaveControlledRunLength, 3)
  assert.equal(kingCloser.martianConclaveControlPenalty, 0)
  assert.equal(kingAcross.martianConclaveControlPenalty, 0)
  assert.equal(bishopStep.martianConclaveControlPenalty, 0)
  assert.equal(kingAway.martianConclaveControlledRunLength, 4)
  assert.equal(kingAway.martianConclaveControlPenalty, 1)
})

test('martian conclave requires three contiguous squares reached by clear bishop rays', () => {
  const source = '8/8/2K1k3/8/3BB3/8/8/8 w - - 4 3'
  const blocked = '8/8/2K1k3/4P3/3BB3/8/8/8 w - - 4 3'
  const belowThreshold = scoreTwoBishopsWhiteMove(source, 'Be3')
  const blockedStep = scoreTwoBishopsWhiteMove(blocked, 'Bd3')

  assert.equal(belowThreshold.martianConclaveControlledRunLength, 1)
  assert.equal(belowThreshold.martianConclaveControlPenalty, 1)
  assert.equal(blockedStep.martianConclaveControlledRunLength, 2)
  assert.equal(blockedStep.martianConclaveControlPenalty, 1)
})

test('martian conclave rejects scattered control and accepts a cyclic wraparound run', () => {
  const scattered = '8/8/2K1k3/6B1/8/8/6B1/8 w - - 0 1'
  const wraparound = '4B3/6B1/4k3/8/2K5/8/8/8 w - - 0 1'
  const scatteredStep = scoreTwoBishopsWhiteMove(scattered, 'Bh3+')
  const wraparoundStep = scoreTwoBishopsWhiteMove(wraparound, 'Bf8')

  assert.equal(scatteredStep.martianConclaveControlledRunLength, 2)
  assert.equal(scatteredStep.martianConclaveControlPenalty, 1)
  assert.equal(wraparoundStep.martianConclaveControlledRunLength, 4)
  assert.equal(wraparoundStep.martianConclaveControlPenalty, 0)
})

test('martian conclave prefers qualifying bishops that remain closer', () => {
  const fen = '8/8/2K1k3/8/3BB3/8/8/8 w - - 4 3'
  const adjacent = scoreTwoBishopsWhiteMove(fen, 'Bd3')
  const separated = scoreTwoBishopsWhiteMove(fen, 'Bc3')
  const martian = twoBishopsWhiteRules.find(
    ({ id }) => id === 'martian conclave step',
  )
  const proximity = martian?.subpriorities?.[1]

  assert.equal(adjacent.martianConclaveControlPenalty, 0)
  assert.equal(separated.martianConclaveControlPenalty, 0)
  assert.equal(adjacent.martianConclaveBishopDistance, 1)
  assert.equal(separated.martianConclaveBishopDistance, 5)
  assert.ok(proximity?.compare)
  assert.ok(proximity.compare(adjacent, separated) < 0)
})

test('martian conclave follows translation and every D4 transform', () => {
  const source = '8/8/2K1k3/8/3BB3/8/8/8 w - - 4 3'
  const sourceMove = getChess(source).move('Bd3')
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
      scoreTwoBishopsWhiteMove(fen, move.san)
        .martianConclaveControlPenalty,
      0,
      transform.name,
    )
    assert.equal(
      ruleSet.currentWhiteHint(fen)?.id,
      'king closer',
      transform.name,
    )
  }

  const translated = '8/8/8/1K1k4/8/2BB4/8/8 w - - 0 1'
  assert.equal(ruleSet.phase(translated), '1/2')
  assert.deepEqual(ruleSet.idealWhiteMoves(translated), ['Bc2'])
  assert.equal(
    scoreTwoBishopsWhiteMove(translated, 'Bc2')
      .martianConclaveControlPenalty,
    0,
  )
})

test('martian conclave replaces the exact pattern and remains inactive in Phase 2', () => {
  const formerPattern = '8/8/3K1k2/8/4BB2/8/8/8 w - - 2 2'
  assert.equal(
    scoreTwoBishopsWhiteMove(formerPattern, 'Be5+')
      .martianConclaveControlPenalty,
    1,
  )

  const phaseTwo = '8/8/5K1k/8/6BB/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')
  const martian = twoBishopsWhiteRules.find(
    ({ id }) => id === 'martian conclave step',
  )
  assert.equal(ruleSet.phase(phaseTwo), '2/2')
  assert.equal(
    martian?.applies?.(scoreTwoBishopsWhiteMove(phaseTwo, 'Bg5+')),
    false,
  )
  assert.notEqual(ruleSet.currentWhiteHint(phaseTwo)?.id, 'martian conclave step')
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

test('king closer scores the resulting king after bishop moves in Phase 1', () => {
  const fen = '3K4/1k1B4/3B4/8/8/8/8/8 w - - 4 3'
  const bishopMove = scoreTwoBishopsWhiteMove(fen, 'Bc5')
  const kingMove = scoreTwoBishopsWhiteMove(fen, 'Ke7')
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.phase(fen), '1/2')
  assert.equal(bishopMove.kingCloserDistance, 5)
  assert.equal(bishopMove.kingCloserMiddleSixteenDistance, 2)
  assert.equal(kingMove.kingCloserDistance, 9)
  assert.equal(
    scoreTwoBishopsWhiteMove(fen, 'Bc7')
      .martianConclaveControlledRunLength,
    2,
  )
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bc8+'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'check')
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

test('check breaks a Phase 1 king closer tie in favor of check', () => {
  const fen = '8/5k2/8/5K2/3BB3/8/8/8 w - - 0 1'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bd5+').checkPenalty, 0)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bc5').checkPenalty, 1)
  assert.deepEqual(getMateRuleSet('two-bishops').idealWhiteMoves(fen), [
    'Bd5+',
  ])
  assert.equal(
    getMateRuleSet('two-bishops').currentWhiteHint(fen)?.id,
    'check',
  )
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

test('bishop waiting moves preserve an already preferred Phase 2 king position', () => {
  const source = '8/8/8/8/5B1k/5B2/5K2/8 w - - 0 1'
  const ruleSet = getMateRuleSet('two-bishops')

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
    assert.equal(
      ruleSet.idealWhiteMoves(fen).includes(waitingMove.san),
      true,
      `${transform.name}: ${waitingMove.san}`,
    )
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
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Kf2'])
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

test('phase 2 wall uniquely accepts the wall opposite the target corner', () => {
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
    assert.equal(score.phaseTwoWallPenalty, 0, `${fen}: ${move.san}`)
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

test("phase 2 wall permits an edge bishop but still rejects walls touching White's king", () => {
  const edgeBishopFen = 'B1k5/8/4K3/8/5B2/8/8/8 w - - 0 1'
  const edgeBishopScore = scoreTwoBishopsWhiteMove(edgeBishopFen, 'Be5')
  assert.equal(edgeBishopScore.bishopsOnBlackEdgeCount, 1)
  assert.equal(edgeBishopScore.phaseTwoWallPenalty, 0)

  const touchingKingFen = '5k2/2B5/2B2K2/8/8/8/8/8 w - - 26 14'
  assert.equal(
    scoreTwoBishopsWhiteMove(touchingKingFen, 'Bd6+')
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
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const move = getChess(fen).moves({ verbose: true }).find(
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
    assert.ok(
      !ruleSet.idealWhiteMoves(fen).includes(move.san),
      `${transform.name}: ${move.san}`,
    )
  }
})

test('phase 2 wall follows the target selected by the relative king race', () => {
  const fen = '8/6B1/8/3B4/5K2/8/7k/8 w - - 4 3'
  const ruleSet = getMateRuleSet('two-bishops')
  const score = scoreTwoBishopsWhiteMove(fen, 'Bd4')

  assert.equal(ruleSet.phase(fen), '2/2')
  assert.equal(score.phaseTwoWallApplies, true)
  assert.equal(score.phaseTwoWallPenalty, 0)
  assert.notEqual(ruleSet.currentWhiteHint(fen)?.id, 'phase 2 wall')
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

test('sequester takes direct progress before two-away control under the king-race target', () => {
  const source = '8/k7/2K4B/8/8/8/8/7B w - - 0 1'
  const sourceMoves = getChess(source).moves({ verbose: true })
  const expectedSource = sourceMoves.find(({ san }) => san === 'Kc7')
  const twoAwaySource = sourceMoves.find(({ san }) => san === 'Bd2')
  assert.ok(expectedSource)
  assert.ok(twoAwaySource)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const expected: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(expectedSource.from, transform) &&
        to === transformSquare(expectedSource.to, transform),
    )
    assert.ok(expected, transform.name)
    const score = scoreTwoBishopsWhiteMove(fen, expected.san)
    assert.ok(
      score.sequesterMaximumCornerReplyDistance <
        score.sequesterCurrentCornerDistance,
      transform.name,
    )
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'sequester', fen)
  }

  assert.equal(
    scoreTwoBishopsWhiteMove(source, twoAwaySource.san)
      .sequesterTwoAwayControlPenalty,
    0,
  )
})

test('sequester accepts either edge square two steps from Black', () => {
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
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'sequester', fen)
  }
})

test('mate-in-four degenerate outranks an overlapping two-away sequester move', () => {
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
  assert.equal(sequester?.subpriorities?.length, 2)

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
    assert.equal(expectedScore.sequesterCurrentCornerDistance, 6)
    assert.equal(expectedScore.sequesterMaximumCornerReplyDistance, 7)
    assert.equal(edgeControlScore.sequesterMaximumCornerReplyDistance, 7)
    assert.equal(edgeControlScore.sequesterTwoAwayControlPenalty, 0)
    assert.equal(
      sequester.subpriorities?.[1]?.when?.([
        expectedScore,
        edgeControlScore,
      ]),
      true,
      transform.name,
    )
    assert.equal(
      twoBishopsWhiteRules
        .find(({ id }) => id === 'bishops away')
        ?.subpriorities?.[0]?.when?.([expectedScore, edgeControlScore]),
      false,
      transform.name,
    )
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'degenerate', fen)
  }
})

test('bishops away uniquely maximizes independent cosine alignment with Be7', () => {
  const source = '2k5/5B2/2KB4/8/8/8/8/8 w - - 0 1'
  const sourceMoves = getChess(source).moves({ verbose: true })
  const expectedSource = sourceMoves.find(({ san }) => san === 'Be7')
  const alternatives = ['Be6+', 'Bd5', 'Ba2'].map((san) =>
    sourceMoves.find((move) => move.san === san),
  )
  assert.ok(expectedSource)
  assert.ok(alternatives.every((move) => move !== undefined))
  const bishopsAway = twoBishopsWhiteRules.find(
    ({ id }) => id === 'bishops away',
  )
  const cosineAlignment = bishopsAway?.subpriorities?.[0]
  assert.ok(cosineAlignment)
  const compare = cosineAlignment.compare
  assert.ok(compare)
  const ruleSet = getMateRuleSet('two-bishops')

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = getChess(fen).moves({ verbose: true })
    const expected: (typeof moves)[number] | undefined = moves.find(
      ({ from, to }) =>
        from === transformSquare(expectedSource.from, transform) &&
        to === transformSquare(expectedSource.to, transform),
    )
    const transformedAlternatives = alternatives.map((sourceMove) =>
      moves.find(
        ({ from, to }) =>
          from === transformSquare(sourceMove!.from, transform) &&
          to === transformSquare(sourceMove!.to, transform),
      ),
    )
    assert.ok(expected, transform.name)
    assert.ok(
      transformedAlternatives.every((move) => move !== undefined),
      transform.name,
    )
    const expectedScore = scoreTwoBishopsWhiteMove(fen, expected.san)
    for (const alternative of transformedAlternatives) {
      const alternativeScore = scoreTwoBishopsWhiteMove(
        fen,
        alternative!.san,
      )
      assert.equal(
        cosineAlignment.when?.([expectedScore, alternativeScore]),
        true,
        transform.name,
      )
      assert.ok(
        expectedScore.bishopsAwayCosineAlignment >
          alternativeScore.bishopsAwayCosineAlignment,
        transform.name,
      )
      assert.ok(compare(expectedScore, alternativeScore) < 0, transform.name)
    }
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), [expected.san], fen)
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'sequester', fen)
  }
})

test('bishops away owns the separated cosine-alignment reason', () => {
  const fen = '8/4B3/8/8/5K2/5B1k/8/8 w - - 4 3'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'bishops away')
  assert.equal(ruleSet.explainWhiteMove(fen, 'Bg5')?.id, 'bishops away')
})

test('resulting valid wall direction determines the target corner', () => {
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

test('target corner falls back to the relative king race with a nearest-wall tie-break', () => {
  const raceSource = '8/8/8/8/2K5/2B5/k1B5/8 w - - 10 6'
  const lowCornerWallSource = '8/6B1/8/8/4K2k/5B2/8/8 w - - 0 1'
  const highCornerWallSource = '8/8/8/8/4KB1k/8/6B1/8 w - - 0 1'
  const noWallTieSource = '8/8/8/8/4K2k/8/2B5/1B6 w - - 0 1'
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

  const noWallTieScore = scoreTwoBishopsWhiteMove(noWallTieSource, 'Bb3')
  const expectedBothCornerAlignment =
    7 / Math.hypot(6, 7) + 5 / Math.hypot(6, 5)
  assert.ok(
    Math.abs(
      noWallTieScore.bishopsAwayCosineAlignment -
        expectedBothCornerAlignment,
    ) < 1e-12,
  )

  const targetCases: readonly {
    readonly sourceFen: string
    readonly sourceMove: { readonly from: Square; readonly to: Square }
    readonly expectedDistance: number
  }[] = [
    {
      sourceFen: raceSource,
      sourceMove: raceMove,
      expectedDistance: 6,
    },
    {
      sourceFen: lowCornerWallSource,
      sourceMove: lowCornerWallMove,
      expectedDistance: 3,
    },
    {
      sourceFen: highCornerWallSource,
      sourceMove: highCornerWallMove,
      expectedDistance: 4,
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

test('phase 2 wall rejects a king-touching alternative', () => {
  const fen = '8/5B2/7k/4BK2/8/8/8/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bg8'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf6').phaseTwoWallPenalty, 1)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bg8').phaseTwoWallPenalty, 0)
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'phase 2 wall')
})

test('the former force-phase fixture remains Phase 1 under exact-two geometry', () => {
  const source = '8/1B4k1/3BK3/8/8/8/8/8 w - - 24 13'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.equal(ruleSet.phase(source), '1/2')
  assert.equal(
    scoreTwoBishopsWhiteMove(source, 'Be4')
      .martianConclaveControlledRunLength,
    1,
  )
  assert.deepEqual(ruleSet.idealWhiteMoves(source), ['Bd5'])
  assert.ok(
    getChess(source)
      .moves()
      .every(
        (san) =>
          scoreTwoBishopsWhiteMove(source, san).forcePhaseTwoPenalty === 1,
      ),
  )
  assert.equal(ruleSet.currentWhiteHint(source)?.id, 'finish wall')

  const afterBe4 = getChess(source)
  afterBe4.move('Be4')
  assert.deepEqual(afterBe4.moves().sort(), ['Kg8', 'Kh6', 'Kh8'])
  for (const blackReply of afterBe4.moves()) {
    const afterReply = getChess(afterBe4.fen())
    afterReply.move(blackReply)
    const blackKing = findPiece(afterReply.fen(), 'b', 'k')
    assert.ok(blackKing)
    const { file, rank } = squareCoordinates(blackKing.square)
    assert.ok(file === 0 || file === 7 || rank === 0 || rank === 7)
  }

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = ruleSet.idealWhiteMoves(fen)
    assert.equal(moves.length, 1, fen)
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, moves[0]!).forcePhaseTwoPenalty,
      1,
      fen,
    )
    assert.equal(
      ruleSet.currentWhiteHint(fen)?.id,
      'finish wall',
      fen,
    )
  }
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
  assert.equal(ruleSet.explainWhiteMove(fen, 'Ke4')?.id, 'force phase 2')
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
  assert.equal(ruleSet.currentWhiteHint(source)?.id, 'bishops away')

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

test('the removed bishop advance position cascades to phase 2 wall', () => {
  const fen = '8/6B1/6B1/8/7k/5K2/8/8 w - - 6 4'
  const ruleSet = getMateRuleSet('two-bishops')

  assert.equal(getTwoBishopsDegenerateReasonLabel(fen), undefined)
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bf6+'])
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'phase 2 wall')
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
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateMateInFour.fen,
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKnightStepControl.fen,
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateWallWaitingMove.fen,
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateCornerDiagonals.fen,
    kingLiftFen('h1'),
    edgeRepairFen('h3', 'd1'),
    edgeRepairFen('h3', 'c2'),
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateDiagonalSetup.fen,
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateDiagonalWaitingMove.fen,
    '2B5/8/8/8/8/4B3/5K2/7k w - - 0 1',
    TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateWaitingMove.fen,
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
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'bishops away')
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
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'bishops away')
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
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'bishops away')

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
      'bishops away',
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
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'bishops away')
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

test('conclave step ignores rotation, reflection, translation, and board walls', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const source = '8/8/8/4BB2/8/3K4/5k2/8 w - - 16 9'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = ruleSet.idealWhiteMoves(fen)
    assert.equal(moves.length, 1, fen)
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, moves[0]!).conclaveStepPenalty,
      0,
      fen,
    )
    assert.ok(
      ['force phase 2', 'conclave step'].includes(
        ruleSet.currentWhiteHint(fen)?.id ?? '',
      ),
      fen,
    )
  }

  const againstWall = '4BB2/8/3K4/5k2/8/8/8/8 w - - 0 1'
  assert.deepEqual(ruleSet.idealWhiteMoves(againstWall), ['Be7'])
  assert.equal(ruleSet.currentWhiteHint(againstWall)?.id, 'conclave step')
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
    "Target corner: Calculate after White's move. If a two-square bishop wall forces every Black reply along the edge in one direction, use that corner. Otherwise, use the corner where White has the better relative king race; on a tie, use the nearest wall to cage Black, retaining both corners if still tied.",
  ])
  assert.deepEqual(ruleSet.help.noteBoards.map(({ id }) => id), [
    'bishop-degenerate-mate-in-four',
    'bishop-degenerate-knight-step-control',
    'bishop-degenerate-wall-waiting-move',
    'bishop-degenerate-corner-diagonals',
    'bishop-degenerate-edge-repair',
    'bishop-degenerate-edge-unmask',
    'bishop-degenerate-diagonal-setup',
    'bishop-degenerate-diagonal-waiting-move',
    'bishop-degenerate-free-bishop',
    'bishop-degenerate-waiting-move',
    'bishop-degenerate-king-flank',
    'bishop-degenerate-king-sidestep',
    'bishop-degenerate-reform-wall',
    'bishop-degenerate-king-lift',
    'bishop-degenerate-bishop-retreat',
    'bishop-degenerate-long-diagonal',
    'bishop-mating-position',
    'bishop-phase-two-wall',
    'bishop-proximate-wall',
    'bishop-conclave-step',
    'bishop-reverse-conclave-step',
    'bishop-martian-conclave-step',
  ])
  assert.deepEqual(
    ruleSet.help.noteBoards
      .slice(0, TWO_BISHOPS_DEGENERATE_PRIORITY_ORDER.length)
      .map(({ title }) => title),
    TWO_BISHOPS_DEGENERATE_PRIORITY_ORDER,
  )
  const mateInFourBoard = ruleSet.help.noteBoards[0]!
  assert.deepEqual(
    mateInFourBoard.highlights.map(({ square }) => square),
    ['a6'],
  )
  assert.deepEqual(mateInFourBoard.arrows, [{ from: 'c6', to: 'c7' }])
  const knightStepControlBoard = ruleSet.help.noteBoards[1]!
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
  const wallWaitingMoveBoard = ruleSet.help.noteBoards[2]!
  assert.deepEqual(
    wallWaitingMoveBoard.highlights.map(({ square }) => square),
    ['g8', 'h8'],
  )
  assert.deepEqual(wallWaitingMoveBoard.arrows, [
    { from: 'f6', to: 'e5' },
  ])
  const cornerDiagonalsBoard = ruleSet.help.noteBoards[3]!
  assert.deepEqual(
    cornerDiagonalsBoard.highlights.map(({ square }) => square),
    ['f8', 'h5'],
  )
  assert.equal(
    cornerDiagonalsBoard.caption,
    "Preserve one bishop's control of f8. Ensure the other bishop controls h5.",
  )
  assert.deepEqual(cornerDiagonalsBoard.arrows, [
    { from: 'b7', to: 'f3' },
  ])
  const edgeRepairBoard = ruleSet.help.noteBoards[4]!
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
  const edgeUnmaskBoard = ruleSet.help.noteBoards[5]!
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
  const diagonalSetupBoard = ruleSet.help.noteBoards[6]!
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
  const diagonalWaitingBoard = ruleSet.help.noteBoards[7]!
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
  const freeBishopBoard = ruleSet.help.noteBoards[8]!
  assert.deepEqual(
    freeBishopBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateFreeBishop.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  const waitingMoveBoard = ruleSet.help.noteBoards[9]!
  assert.deepEqual(
    waitingMoveBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateWaitingMove.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  const kingFlankBoard = ruleSet.help.noteBoards[10]!
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
  const kingSidestepBoard = ruleSet.help.noteBoards[11]!
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
  const reformWallBoard = ruleSet.help.noteBoards[12]!
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
  const kingLiftBoard = ruleSet.help.noteBoards[13]!
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
  const bishopRetreatBoard = ruleSet.help.noteBoards[14]!
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
  const longDiagonalBoard = ruleSet.help.noteBoards[15]!
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
  const matingPositionBoard = ruleSet.help.noteBoards[16]!
  assert.deepEqual(
    matingPositionBoard.pieces,
    TWO_BISHOPS_DIAGRAM_POSITIONS.matingPosition.pieces,
  )
  assert.deepEqual(
    matingPositionBoard.highlights.map(({ square }) => square),
    ['f8', 'f7'],
  )
  const phaseTwoWallBoard = ruleSet.help.noteBoards[17]!
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
  const proximateWallBoard = ruleSet.help.noteBoards[18]!
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
  const conclaveBoard = ruleSet.help.noteBoards[19]!
  assert.deepEqual(
    conclaveBoard.pieces,
    getEndgamePiecePlacements(TWO_BISHOPS_DIAGRAM_POSITIONS.conclaveStep.fen)
      .map(({ color, square, type }) => ({
        square,
        piece: color === 'w' ? type.toUpperCase() : type,
      })),
  )
  assert.deepEqual(conclaveBoard.arrows, [{ from: 'f5', to: 'e4' }])
  const reverseConclaveBoard = ruleSet.help.noteBoards[20]!
  assert.deepEqual(
    reverseConclaveBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.reverseConclaveStep.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  assert.deepEqual(reverseConclaveBoard.layout, {
    files: 8,
    ranks: 8,
    fileOffset: 0,
  })
  assert.deepEqual(reverseConclaveBoard.highlights, [])
  assert.deepEqual(reverseConclaveBoard.arrows, [
    { from: 'e5', to: 'd6' },
  ])
  const martianConclaveBoard = ruleSet.help.noteBoards[21]!
  assert.equal(
    TWO_BISHOPS_DIAGRAM_POSITIONS.martianConclaveStep.fen,
    '8/8/2K1k3/8/3BB3/8/8/8 w - - 4 3',
  )
  assert.deepEqual(
    martianConclaveBoard.pieces,
    getEndgamePiecePlacements(
      TWO_BISHOPS_DIAGRAM_POSITIONS.martianConclaveStep.fen,
    ).map(({ color, square, type }) => ({
      square,
      piece: color === 'w' ? type.toUpperCase() : type,
    })),
  )
  assert.deepEqual(martianConclaveBoard.layout, {
    files: 8,
    ranks: 8,
    fileOffset: 0,
  })
  assert.deepEqual(
    martianConclaveBoard.highlights.map(({ square }) => square),
    ['e5', 'f5', 'f6'],
  )
  assert.deepEqual(martianConclaveBoard.arrows, [
    { from: 'e4', to: 'd3' },
  ])
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
