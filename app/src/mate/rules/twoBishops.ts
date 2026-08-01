import type { Square } from 'chess.js'
import {
  edgeDistance,
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  hasDirectKingOpposition,
  kingDistance,
  squareColor,
  squareCoordinates,
  squareFromCoordinates,
  withFenTurn,
} from '../chess'
import { compareScoresByRules, selectIdealMoves } from './selection'
import {
  centerDistance,
  distanceToNearestUnprotectedWhiteBishop,
  getBlackKingReachableArea,
  getCurrentEdgeCorners,
  getTwoBishopsPhaseLabel,
  getWhiteBishopSquares,
  getWhiteKingBishopScreeningPenalty,
  isTwoBishopsPhaseTwoPosition,
  sharesAnyEdge,
  whiteBishopsAreAdjacent,
} from './twoBishopsGeometry'
import type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RuleHelp,
  RuleNoteBoardPiece,
  ScoredMove,
} from './types'
import { TWO_BISHOPS_DIAGRAM_POSITIONS } from './twoBishopsDiagramPositions'

export type TwoBishopsWhiteMoveScore = {
  readonly matePenalty: number
  readonly stalematePenalty: number
  readonly bishopSafetyPenalty: number
  readonly cornerCheckPenalty: number
  readonly waitingApplies: boolean
  readonly waitingMovePenalty: number
  readonly waitingColorLockPenalty: number
  readonly wallBuiltBefore: boolean
  readonly formWallApplies: boolean
  readonly formWallPenalty: number
  readonly pushKingApplies: boolean
  readonly pushKingPenalty: number
  readonly guaranteedBlackWallDistance: number
  readonly advanceWallApplies: boolean
  readonly advanceWallPenalty: number
  readonly advanceWallWorstEdgeBishops: number
  readonly advanceWallWorstArea: number
  readonly cornerWaitingApplies: boolean
  readonly cornerReadyWaitingApplies: boolean
  readonly blackReplyCount: number
  readonly cornerWaitingEdgePenalty: number
  readonly cornerWaitingCenterDistance: number
  readonly edgeResetApplies: boolean
  readonly midpointCheckApplies: boolean
  readonly midpointCheckPenalty: number
  readonly edgePhaseApplies: boolean
  readonly edgeSealApplies: boolean
  readonly edgeSealPenalty: number
  readonly edgePlanApplies: boolean
  readonly holdEdgePenalty: number
  readonly cornerSetupApplies: boolean
  readonly cornerBishopDriveApplies: boolean
  readonly cornerTurnApplies: boolean
  readonly cornerTurnSupportApplies: boolean
  readonly cornerTurnEdgePenalty: number
  readonly cornerSupportBlockers: number
  readonly cornerSupportDistance: number
  readonly cornerKingDistance: number
  readonly directOppositionPenalty: number
  readonly cornerDriveApplies: boolean
  readonly cornerDriveCheckPenalty: number
  readonly cornerDriveDistance: number
  readonly tightenWallApplies: boolean
  readonly wallMovePenalty: number
  readonly setupCheckPenalty: number
  readonly bishopAdjacencyPenalty: number
  readonly blackKingReachableArea: number
  readonly kingApproachApplies: boolean
  readonly kingBishopScreeningPenalty: number
  readonly kingApproachPenalty: number
  readonly worstReplyKingDistance: number
  readonly tempoApplies: boolean
  readonly tempoMovePenalty: number
  readonly tempoAreaPenalty: number
  readonly tempoSetupPenalty: number
  readonly tempoTowardBlackPenalty: number
  readonly tempoBishopBlackDistance: number
  readonly tempoBishopKingDistance: number
  readonly tempoEdgeBishops: number
  readonly tempoTargetCornerDistance: number
  readonly tempoMoveDistance: number
}

type TwoBishopsPositionContext = {
  readonly currentReachableArea: number
  readonly cornerDriveApplies: boolean
  readonly cornerBishopDriveApplies: boolean
  readonly cornerSetupApplies: boolean
  readonly cornerTurnApplies: boolean
  readonly cornerTurnSupportApplies: boolean
  readonly cornerWaitingApplies: boolean
  readonly cornerReadyWaitingApplies: boolean
  readonly currentCornerSupportBlockers: number
  readonly currentCornerSupportDistance: number
  readonly kingApproachApplies: boolean
  readonly edgePhaseApplies: boolean
  readonly edgeSealApplies: boolean
  readonly edgePlanApplies: boolean
  readonly edgeResetApplies: boolean
  readonly midpointCheckApplies: boolean
  readonly targetCorners: readonly Square[]
  readonly tempoApplies: boolean
  readonly tightenWallApplies: boolean
  readonly waitingApplies: boolean
  readonly wallBuiltBefore: boolean
  readonly formWallApplies: boolean
  readonly pushKingApplies: boolean
  readonly advanceWallApplies: boolean
  readonly phaseOneMoveMetrics: ReadonlyMap<string, PhaseOneMoveMetrics>
}

type PhaseOneMoveMetrics = {
  readonly formWallPenalty: number
  readonly pushKingPenalty: number
  readonly guaranteedBlackWallDistance: number
  readonly advanceWallPenalty: number
  readonly advanceWallWorstEdgeBishops: number
  readonly advanceWallWorstArea: number
}

export type TwoBishopsBlackMoveScore = {
  readonly bishopCapturePenalty: number
  readonly centerDistance: number
  readonly unprotectedBishopDistance: number
}

const WHITE_INTRO =
  "White's best moves are the moves that survive these priorities in order. If several moves are still tied after a priority, they all remain best moves."

const BLACK_INTRO =
  'Black uses its own priorities to put up the strongest resistance. Black is not trying to help the mate; it looks for the most stubborn legal reply.'
const EDGE_FINISH_HELP =
  'Phase 2: edge to corner. King set: drive; else seal closer. One step: clear support in cage; keep edge, avoid old wall, nearer; then king/replies/matching bishop. Drive/wall toward Black. Stuck: wait with replies. Corner: opposite bishop.'
const FORM_WALL_HELP =
  'Phase 1: first make the bishops side by side without screening one. Prefer a safe quiet wall with fewer bishops on the board edge, then give Black the smaller reachable region.'
const KING_APPROACH_HELP =
  'With the wall fixed, move White’s king without screening a bishop. Prefer a move that forces every Black reply farther from the wall; while building the wall, bring the king closer.'
const ADVANCE_WALL_HELP =
  'When the king cannot push Black farther, advance the side-by-side wall. A two-move advance must survive every reply. Prefer fewer edge bishops, then a smaller region. Exact tie: move the bishop opposite Black’s color.'
const WAITING_HELP =
  'Only when the wall cannot be formed, the king cannot progress, and the wall cannot advance, make a safe quiet bishop wait that preserves the cage and stays off the edge.'

const twoBishopsHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: WHITE_INTRO,
  blackIntro: BLACK_INTRO,
  blackPriorities: [
    "Take a piece if White isn't looking.",
    'Move toward the center.',
    'Move toward an unprotected bishop.',
  ],
  notes: [
    "Phase 2 begins when Black cannot leave its current edge, or when White's king can seal that edge on this move.",
  ],
  noteBoards: [
    {
      id: 'bishop-corner-finish',
      title: 'corner finish',
      caption: 'Keep Black on the edge while White’s king reaches the finish.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(TWO_BISHOPS_DIAGRAM_POSITIONS.cornerFinish.fen),
      highlights: [],
    },
  ],
}

function noteBoardPieces(fen: string): readonly RuleNoteBoardPiece[] {
  return getEndgamePiecePlacements(fen).map(({ color, square, type }) => ({
    square,
    piece: (color === 'w' ? type.toUpperCase() : type) as RuleNoteBoardPiece['piece'],
  }))
}

export function scoreTwoBishopsWhiteMove(
  fen: string,
  san: string,
  context: TwoBishopsPositionContext = createTwoBishopsPositionContext(fen),
): TwoBishopsWhiteMoveScore {
  const beforeBlackKing = findPiece(fen, 'b', 'k')
  const beforeWhiteKing = findPiece(fen, 'w', 'k')
  const beforeBishopsAdjacent = whiteBishopsAreAdjacent(fen)
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const blackKing = findPiece(resultFen, 'b', 'k')
  const whiteKing = findPiece(resultFen, 'w', 'k')
  const replyFens = getBlackReplyFens(resultFen)
  const bishopCanBeCaptured = replyFens.some(
    (replyFen) => getWhiteBishopSquares(replyFen).length < 2,
  )
  const holdEdgePenalty = keepsBlackOnStartingEdge(
    beforeBlackKing?.square,
    replyFens,
  )
    ? 0
    : 1
  const resultReachableArea = getBlackKingReachableArea(resultFen)
  const resultBishopsAdjacent = whiteBishopsAreAdjacent(resultFen)
  const worstReplyKingDistance = getWorstReplyKingDistance(
    replyFens,
    resultFen,
  )
  const quietSafeMove =
    !chess.isCheck() &&
    !chess.isStalemate() &&
    !bishopCanBeCaptured
  const wallProgress =
    quietSafeMove &&
    (context.edgePhaseApplies
      ? holdEdgePenalty === 0 &&
        resultBishopsAdjacent &&
        resultReachableArea <= context.currentReachableArea
      : beforeBishopsAdjacent
        ? resultBishopsAdjacent &&
          resultReachableArea < context.currentReachableArea
        : move.piece === 'b' &&
          (resultBishopsAdjacent ||
            resultReachableArea < context.currentReachableArea))
  const kingApproach =
    move.piece === 'k' &&
    !chess.isStalemate() &&
    !bishopCanBeCaptured &&
    beforeWhiteKing &&
    whiteKing &&
    blackKing &&
    getWhiteKingBishopScreeningPenalty(resultFen) === 0 &&
    kingDistance(whiteKing.square, blackKing.square) <
      kingDistance(
        beforeWhiteKing.square,
        beforeBlackKing?.square ?? blackKing.square,
      )
  const cornerSupportBlockers = getCornerSupportBlockers(
    resultFen,
    context.targetCorners,
  )
  const cornerSupportDistance = getCornerSupportDistance(
    resultFen,
    context.targetCorners,
  )
  const phaseOneMetrics = context.phaseOneMoveMetrics.get(san) ?? {
    advanceWallPenalty: 1,
    advanceWallWorstArea: 64,
    advanceWallWorstEdgeBishops: 2,
    formWallPenalty: 1,
    guaranteedBlackWallDistance: 0,
    pushKingPenalty: 1,
  }
  return {
    matePenalty: chess.isCheckmate() ? 0 : 1,
    stalematePenalty: !chess.isCheckmate() && chess.isStalemate() ? 1 : 0,
    bishopSafetyPenalty: bishopCanBeCaptured ? 1 : 0,
    cornerCheckPenalty:
      beforeBlackKing &&
      edgeDistance(beforeBlackKing.square) === 0 &&
      getCurrentEdgeCorners(beforeBlackKing.square).some(
        (corner) => kingDistance(beforeBlackKing.square, corner) <= 1,
      ) &&
      move.piece === 'b' &&
      chess.isCheck() &&
      allBlackRepliesAllowMateNext(resultFen)
        ? 0
        : 1,
    waitingApplies: context.waitingApplies,
    waitingMovePenalty:
      move.piece === 'b' && quietSafeMove ? 0 : 1,
    waitingColorLockPenalty:
      beforeBlackKing &&
      move.piece === 'b' &&
      squareColor(move.from) !== squareColor(beforeBlackKing.square)
        ? 0
        : 1,
    wallBuiltBefore: context.wallBuiltBefore,
    formWallApplies: context.formWallApplies,
    formWallPenalty: phaseOneMetrics.formWallPenalty,
    pushKingApplies: context.pushKingApplies,
    pushKingPenalty: phaseOneMetrics.pushKingPenalty,
    guaranteedBlackWallDistance:
      phaseOneMetrics.guaranteedBlackWallDistance,
    advanceWallApplies: context.advanceWallApplies,
    advanceWallPenalty: phaseOneMetrics.advanceWallPenalty,
    advanceWallWorstEdgeBishops:
      phaseOneMetrics.advanceWallWorstEdgeBishops,
    advanceWallWorstArea: phaseOneMetrics.advanceWallWorstArea,
    cornerWaitingApplies: context.cornerWaitingApplies,
    cornerReadyWaitingApplies: context.cornerReadyWaitingApplies,
    blackReplyCount: replyFens.length,
    cornerWaitingEdgePenalty: edgeDistance(move.to) === 0 ? 1 : 0,
    cornerWaitingCenterDistance: centerDistance(move.to),
    edgeResetApplies: context.edgeResetApplies,
    midpointCheckApplies: context.midpointCheckApplies,
    midpointCheckPenalty:
      move.piece === 'b' &&
      !chess.isStalemate() &&
      !bishopCanBeCaptured &&
      chess.isCheck() &&
      holdEdgePenalty === 0
        ? 0
        : 1,
    edgePhaseApplies: context.edgePhaseApplies,
    edgeSealApplies: context.edgeSealApplies,
    edgeSealPenalty:
      move.piece === 'k' &&
      quietSafeMove &&
      holdEdgePenalty === 0
        ? 0
        : 1,
    edgePlanApplies: context.edgePlanApplies,
    holdEdgePenalty,
    cornerSetupApplies: context.cornerSetupApplies,
    cornerBishopDriveApplies: context.cornerBishopDriveApplies,
    cornerTurnApplies: context.cornerTurnApplies,
    cornerTurnSupportApplies: context.cornerTurnSupportApplies,
    cornerTurnEdgePenalty: keepsBlackOnAnyEdge(replyFens) ? 0 : 1,
    cornerSupportBlockers,
    cornerSupportDistance,
    cornerKingDistance: getKingTargetCornerDistance(
      whiteKing?.square,
      context.targetCorners,
    ),
    directOppositionPenalty:
      whiteKing &&
      blackKing &&
      hasDirectKingOpposition(whiteKing.square, blackKing.square)
        ? 0
        : 1,
    cornerDriveApplies: context.cornerDriveApplies,
    cornerDriveCheckPenalty: chess.isCheck() ? 0 : 1,
    cornerDriveDistance: getWorstReplyCornerDistance(
      replyFens,
      context.targetCorners,
    ),
    tightenWallApplies: context.tightenWallApplies,
    wallMovePenalty: wallProgress ? 0 : 1,
    setupCheckPenalty: chess.isCheck() ? 1 : 0,
    bishopAdjacencyPenalty: resultBishopsAdjacent ? 0 : 1,
    blackKingReachableArea: resultReachableArea,
    kingApproachApplies: context.kingApproachApplies,
    kingBishopScreeningPenalty: getWhiteKingBishopScreeningPenalty(resultFen),
    kingApproachPenalty: kingApproach ? 0 : 1,
    worstReplyKingDistance,
    tempoApplies: context.tempoApplies,
    tempoMovePenalty:
      move.piece === 'b' &&
      quietSafeMove
        ? 0
        : 1,
    tempoAreaPenalty:
      resultReachableArea <= context.currentReachableArea ? 0 : 1,
    tempoSetupPenalty:
      cornerSupportBlockers < context.currentCornerSupportBlockers ||
      (cornerSupportBlockers === context.currentCornerSupportBlockers &&
        cornerSupportDistance <= context.currentCornerSupportDistance)
        ? 0
        : 1,
    tempoTowardBlackPenalty:
      beforeBlackKing &&
      move.piece === 'b' &&
      movesTowardSquare(move.from, move.to, beforeBlackKing.square)
        ? 0
        : 1,
    tempoBishopBlackDistance: getWorstReplyBishopBlackDistance(
      replyFens,
      resultFen,
    ),
    tempoBishopKingDistance: getBishopWhiteKingDistance(resultFen),
    tempoEdgeBishops: getWhiteBishopSquares(resultFen).filter(
      (square) => edgeDistance(square) === 0,
    ).length,
    tempoTargetCornerDistance: getKingTargetCornerDistance(
      whiteKing?.square,
      context.targetCorners,
    ),
    tempoMoveDistance:
      kingDistance(move.from, move.to),
  }
}

export const twoBishopsWhiteRules: readonly OrderedRule<TwoBishopsWhiteMoveScore>[] = [
  {
    id: 'mate',
    shortLabel: 'mate',
    helpText: '',
    stopWhenBest: (score) => score.matePenalty === 0,
    compare: (first, second) => first.matePenalty - second.matePenalty,
  },
  {
    id: 'bishops safe',
    shortLabel: 'pieces safe',
    helpText: '',
    compare: (first, second) =>
      first.bishopSafetyPenalty - second.bishopSafetyPenalty,
  },
  {
    id: 'no stalemate',
    shortLabel: 'no stalemate',
    helpText: '',
    compare: (first, second) =>
      first.stalematePenalty - second.stalematePenalty,
  },
  {
    id: 'edge finish',
    shortLabel: 'edge finish',
    helpText: EDGE_FINISH_HELP,
    applies: (score) => score.edgePhaseApplies,
    subpriorities: [
      {
        compare: (first, second) =>
          first.cornerCheckPenalty - second.cornerCheckPenalty,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerBishopDriveApplies),
        compare: (first, second) =>
          first.cornerDriveDistance - second.cornerDriveDistance,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerBishopDriveApplies),
        compare: (first, second) =>
          first.tempoMovePenalty - second.tempoMovePenalty,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerTurnSupportApplies),
        compare: (first, second) =>
          first.cornerSupportBlockers -
          second.cornerSupportBlockers,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerTurnApplies),
        compare: (first, second) =>
          first.cornerTurnEdgePenalty -
          second.cornerTurnEdgePenalty,
      },
      {
        when: (scores) =>
          scores.some(
            (score) =>
              score.cornerTurnApplies && !score.wallBuiltBefore,
          ),
        compare: (first, second) =>
          second.bishopAdjacencyPenalty -
          first.bishopAdjacencyPenalty,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerTurnApplies),
        compare: (first, second) =>
          first.cornerDriveDistance - second.cornerDriveDistance,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerTurnApplies),
        compare: (first, second) =>
          second.tempoMovePenalty - first.tempoMovePenalty,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerTurnApplies),
        compare: (first, second) =>
          second.blackReplyCount - first.blackReplyCount,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerTurnApplies) &&
          scores.every((score) => score.tempoMovePenalty === 0),
        compare: (first, second) =>
          second.waitingColorLockPenalty -
          first.waitingColorLockPenalty,
      },
      {
        when: (scores) => scores.some((score) => score.edgeSealApplies),
        compare: (first, second) =>
          first.edgeSealPenalty - second.edgeSealPenalty,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerWaitingApplies) &&
          scores.every((score) => !score.cornerReadyWaitingApplies) &&
          scores.some(
            (score) =>
              score.waitingMovePenalty === 0 &&
              score.tempoAreaPenalty === 0,
          ),
        compare: (first, second) =>
          first.tempoAreaPenalty - second.tempoAreaPenalty,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerWaitingApplies),
        compare: (first, second) =>
          first.waitingMovePenalty - second.waitingMovePenalty,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerWaitingApplies),
        compare: (first, second) =>
          second.blackReplyCount - first.blackReplyCount,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerWaitingApplies),
        compare: (first, second) =>
          first.tempoEdgeBishops - second.tempoEdgeBishops,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerReadyWaitingApplies),
        compare: (first, second) =>
          first.waitingColorLockPenalty -
          second.waitingColorLockPenalty,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerWaitingApplies),
        compare: (first, second) =>
          first.tempoMoveDistance - second.tempoMoveDistance,
      },
      {
        compare: (first, second) =>
          first.holdEdgePenalty - second.holdEdgePenalty,
      },
      {
        when: edgeWallAdvanceSubpriorityApplies,
        compare: (first, second) =>
          first.wallMovePenalty - second.wallMovePenalty,
      },
      {
        when: edgeWallAdvanceSubpriorityApplies,
        compare: (first, second) =>
          first.tempoTowardBlackPenalty -
          second.tempoTowardBlackPenalty,
      },
      {
        when: edgeWallAdvanceSubpriorityApplies,
        compare: (first, second) =>
          first.blackKingReachableArea -
          second.blackKingReachableArea,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerSetupApplies),
        compare: (first, second) =>
          first.cornerSupportBlockers -
          second.cornerSupportBlockers,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerSetupApplies),
        compare: (first, second) =>
          first.cornerSupportDistance -
          second.cornerSupportDistance,
      },
      {
        when: (scores) =>
          scores.some((score) => score.cornerSetupApplies),
        compare: (first, second) =>
          first.directOppositionPenalty -
          second.directOppositionPenalty,
      },
      {
        compare: (first, second) =>
          first.cornerDriveDistance - second.cornerDriveDistance,
      },
      {
        compare: (first, second) =>
          first.tempoTowardBlackPenalty -
          second.tempoTowardBlackPenalty,
      },
      {
        compare: (first, second) =>
          first.wallMovePenalty - second.wallMovePenalty,
      },
      {
        compare: (first, second) =>
          first.blackKingReachableArea -
          second.blackKingReachableArea,
      },
      {
        compare: (first, second) =>
          first.cornerSupportDistance -
          second.cornerSupportDistance,
      },
      {
        compare: (first, second) =>
          first.bishopAdjacencyPenalty -
          second.bishopAdjacencyPenalty,
      },
      {
        compare: (first, second) =>
          first.kingBishopScreeningPenalty -
          second.kingBishopScreeningPenalty,
      },
      {
        compare: (first, second) =>
          first.kingApproachPenalty - second.kingApproachPenalty,
      },
      {
        compare: (first, second) =>
          first.worstReplyKingDistance -
          second.worstReplyKingDistance,
      },
      {
        compare: (first, second) =>
          first.tempoMovePenalty - second.tempoMovePenalty,
      },
      {
        compare: (first, second) =>
          first.waitingColorLockPenalty -
          second.waitingColorLockPenalty,
      },
      {
        compare: (first, second) =>
          first.tempoAreaPenalty - second.tempoAreaPenalty,
      },
      {
        compare: (first, second) =>
          first.tempoTowardBlackPenalty -
          second.tempoTowardBlackPenalty,
      },
      {
        compare: (first, second) =>
          first.tempoBishopKingDistance -
          second.tempoBishopKingDistance,
      },
      {
        compare: (first, second) =>
          first.tempoEdgeBishops - second.tempoEdgeBishops,
      },
      {
        compare: (first, second) =>
          first.tempoMoveDistance - second.tempoMoveDistance,
      },
    ],
  },
  {
    id: 'form wall',
    shortLabel: 'form wall',
    helpText: FORM_WALL_HELP,
    applies: (score) => !score.edgePhaseApplies && score.formWallApplies,
    subpriorities: [
      {
        compare: (first, second) =>
          first.formWallPenalty - second.formWallPenalty,
      },
      {
        compare: (first, second) =>
          first.kingBishopScreeningPenalty -
          second.kingBishopScreeningPenalty,
      },
      {
        compare: (first, second) =>
          first.tempoEdgeBishops - second.tempoEdgeBishops,
      },
      {
        compare: (first, second) =>
          first.blackKingReachableArea -
          second.blackKingReachableArea,
      },
      {
        compare: (first, second) =>
          first.waitingColorLockPenalty -
          second.waitingColorLockPenalty,
      },
    ],
  },
  {
    id: 'push with king',
    shortLabel: 'push with king',
    helpText: KING_APPROACH_HELP,
    applies: (score) => !score.edgePhaseApplies && score.pushKingApplies,
    subpriorities: [
      {
        compare: (first, second) =>
          first.pushKingPenalty - second.pushKingPenalty,
      },
      {
        when: (scores) => scores.every((score) => score.wallBuiltBefore),
        compare: (first, second) =>
          second.guaranteedBlackWallDistance -
          first.guaranteedBlackWallDistance,
      },
      {
        compare: (first, second) =>
          first.kingBishopScreeningPenalty -
          second.kingBishopScreeningPenalty,
      },
      {
        compare: (first, second) =>
          first.kingApproachPenalty - second.kingApproachPenalty,
      },
      {
        compare: (first, second) =>
          first.worstReplyKingDistance -
          second.worstReplyKingDistance,
      },
    ],
  },
  {
    id: 'advance wall',
    shortLabel: 'advance wall',
    helpText: ADVANCE_WALL_HELP,
    applies: (score) =>
      !score.edgePhaseApplies && score.advanceWallApplies,
    subpriorities: [
      {
        compare: (first, second) =>
          first.advanceWallPenalty - second.advanceWallPenalty,
      },
      {
        compare: (first, second) =>
          first.advanceWallWorstEdgeBishops -
          second.advanceWallWorstEdgeBishops,
      },
      {
        compare: (first, second) =>
          first.advanceWallWorstArea -
          second.advanceWallWorstArea,
      },
      {
        compare: (first, second) =>
          first.tempoMoveDistance - second.tempoMoveDistance,
      },
      {
        compare: (first, second) =>
          first.waitingColorLockPenalty -
          second.waitingColorLockPenalty,
      },
    ],
  },
  {
    id: 'waiting move',
    shortLabel: 'waiting move',
    helpText: WAITING_HELP,
    applies: (score) => !score.edgePhaseApplies && score.waitingApplies,
    subpriorities: [
      {
        compare: (first, second) =>
          first.waitingMovePenalty - second.waitingMovePenalty,
      },
      {
        compare: (first, second) =>
          first.waitingColorLockPenalty -
          second.waitingColorLockPenalty,
      },
      {
        compare: (first, second) =>
          first.tempoAreaPenalty - second.tempoAreaPenalty,
      },
      {
        compare: (first, second) =>
          first.tempoTowardBlackPenalty -
          second.tempoTowardBlackPenalty,
      },
      {
        compare: (first, second) =>
          first.bishopAdjacencyPenalty -
          second.bishopAdjacencyPenalty,
      },
      {
        compare: (first, second) =>
          first.tempoBishopKingDistance -
          second.tempoBishopKingDistance,
      },
      {
        compare: (first, second) =>
          first.tempoEdgeBishops - second.tempoEdgeBishops,
      },
      {
        compare: (first, second) =>
          first.tempoMoveDistance - second.tempoMoveDistance,
      },
    ],
  },
]

function edgeWallAdvanceSubpriorityApplies(
  scores: readonly TwoBishopsWhiteMoveScore[],
): boolean {
  const directedWallAdvanceExists = scores.some(
    (score) =>
      score.wallMovePenalty === 0 &&
      score.tempoTowardBlackPenalty === 0,
  )
  return scores.some(
    (score) =>
      score.wallBuiltBefore &&
      score.tightenWallApplies &&
      !score.edgeSealApplies &&
      (directedWallAdvanceExists ||
        (!score.cornerDriveApplies &&
          !score.cornerSetupApplies)),
  )
}

function createTwoBishopsPositionContext(
  fen: string,
): TwoBishopsPositionContext {
  const beforeBlackKing = findPiece(fen, 'b', 'k')
  const beforeWhiteKing = findPiece(fen, 'w', 'k')
  const edgePhaseApplies = isTwoBishopsPhaseTwoPosition(fen)
  const blackOnEdge = Boolean(
    beforeBlackKing && edgeDistance(beforeBlackKing.square) === 0,
  )
  const blackAlreadyConfined = blackIsConfinedToCurrentEdge(
    fen,
    beforeBlackKing?.square,
  )
  const targetCorners = getTargetCorners(fen)
  const currentReachableArea = getBlackKingReachableArea(fen)
  const currentCornerSupportBlockers = getCornerSupportBlockers(
    fen,
    targetCorners,
  )
  const currentCornerSupportDistance = getCornerSupportDistance(
    fen,
    targetCorners,
  )
  const currentKingTargetCornerDistance = getKingTargetCornerDistance(
    beforeWhiteKing?.square,
    targetCorners,
  )
  const currentCornerDistance =
    beforeBlackKing && targetCorners.length > 0
      ? Math.min(
          ...targetCorners.map((corner) =>
            kingDistance(beforeBlackKing.square, corner),
          ),
        )
      : 0
  const beforeBishopsAdjacent = whiteBishopsAreAdjacent(fen)
  let tightenWallApplies = false
  let kingApproachApplies = false
  let cornerSetupApplies = false
  let cornerDriveApplies = false
  let cornerTurnApplies = false
  let edgeResetMoveExists = false
  let edgeSealMoveExists = false
  let midpointCheckApplies = false
  let tempoMoveExists = false
  let formWallMoveExists = false
  let forcedKingPushExists = false
  let advanceWallMoveExists = false
  const phaseOneMoveMetrics = new Map<string, PhaseOneMoveMetrics>()
  const advanceWallCandidates: Array<{
    readonly resultFen: string
    readonly san: string
  }> = []
  const currentWallDistance =
    beforeBlackKing === undefined
      ? 0
      : getBlackDistanceFromBishopWall(fen, beforeBlackKing.square)
  const currentEdgeBishops = getWhiteBishopSquares(fen).filter(
    (square) => edgeDistance(square) === 0,
  ).length

  for (const move of getChess(fen).moves({ verbose: true })) {
    const afterWhite = getChess(fen)
    afterWhite.move(move.san)
    const resultFen = afterWhite.fen()
    const bishopCanBeCaptured = blackCanCaptureBishopAfterWhiteMove(resultFen)
    const resultBishopsAdjacent = whiteBishopsAreAdjacent(resultFen)
    const resultWhiteKing = findPiece(resultFen, 'w', 'k')
    const resultBlackKing = findPiece(resultFen, 'b', 'k')
    const quietSafeMove =
      !afterWhite.isCheck() &&
      !afterWhite.isStalemate() &&
      !bishopCanBeCaptured
    const kingApproachMove = Boolean(
      !edgePhaseApplies &&
        move.piece === 'k' &&
        !afterWhite.isStalemate() &&
        !bishopCanBeCaptured &&
        beforeWhiteKing &&
        beforeBlackKing &&
        resultWhiteKing &&
        resultBlackKing &&
        getWhiteKingBishopScreeningPenalty(resultFen) === 0 &&
        kingDistance(resultWhiteKing.square, resultBlackKing.square) <
          kingDistance(beforeWhiteKing.square, beforeBlackKing.square),
    )
    const guaranteedBlackWallDistance =
      beforeBishopsAdjacent &&
      move.piece === 'k' &&
      quietSafeMove &&
      getWhiteKingBishopScreeningPenalty(resultFen) === 0
        ? getGuaranteedBlackWallDistance(resultFen)
        : 0
    const formWallPenalty =
      !beforeBishopsAdjacent &&
      move.piece === 'b' &&
      quietSafeMove &&
      resultBishopsAdjacent
        ? 0
        : 1
    const pushKingPenalty =
      move.piece === 'k' &&
      quietSafeMove &&
      getWhiteKingBishopScreeningPenalty(resultFen) === 0 &&
      (beforeBishopsAdjacent
        ? guaranteedBlackWallDistance > currentWallDistance
        : kingApproachMove)
        ? 0
        : 1
    if (
      !edgePhaseApplies &&
      beforeBishopsAdjacent &&
      move.piece === 'b' &&
      quietSafeMove
    ) {
      advanceWallCandidates.push({ resultFen, san: move.san })
    }
    const metrics: PhaseOneMoveMetrics = {
      formWallPenalty,
      pushKingPenalty,
      guaranteedBlackWallDistance,
      advanceWallPenalty: 1,
      advanceWallWorstEdgeBishops: 2,
      advanceWallWorstArea: 64,
    }
    phaseOneMoveMetrics.set(move.san, metrics)
    if (formWallPenalty === 0) formWallMoveExists = true
    if (
      beforeBishopsAdjacent &&
      pushKingPenalty === 0
    ) {
      forcedKingPushExists = true
    }
    if (
      !edgePhaseApplies &&
      move.piece === 'b' &&
      !afterWhite.isCheck() &&
      !afterWhite.isStalemate() &&
      !bishopCanBeCaptured
    ) {
      const resultArea = getBlackKingReachableArea(resultFen)
      if (
        beforeBishopsAdjacent
          ? resultBishopsAdjacent && resultArea < currentReachableArea
          : resultBishopsAdjacent || resultArea < currentReachableArea
      ) {
        tightenWallApplies = true
      }
    }
    if (
      blackOnEdge &&
      beforeBlackKing &&
      isEdgeMidpointSquare(beforeBlackKing.square) &&
      move.piece === 'b' &&
      afterWhite.isCheck() &&
      !afterWhite.isStalemate() &&
      !bishopCanBeCaptured &&
      keepsBlackOnStartingEdge(
        beforeBlackKing.square,
        getBlackReplyFens(resultFen),
      )
    ) {
      midpointCheckApplies = true
    }
    if (
      edgePhaseApplies &&
      !blackAlreadyConfined &&
      move.piece === 'k' &&
      quietSafeMove &&
      keepsBlackOnStartingEdge(
        beforeBlackKing?.square,
        getBlackReplyFens(resultFen),
      ) &&
      getCornerSupportDistance(resultFen, targetCorners) <
        currentCornerSupportDistance
    ) {
      edgeSealMoveExists = true
    }
    if (
      blackOnEdge &&
      !afterWhite.isCheck() &&
      !afterWhite.isStalemate() &&
      !bishopCanBeCaptured
    ) {
      const resultArea = getBlackKingReachableArea(resultFen)
      const blackReplyFens = getBlackReplyFens(resultFen)
      const holdEdge = keepsBlackOnStartingEdge(
        beforeBlackKing?.square,
        blackReplyFens,
      )
      const worstReplyCornerDistance = getWorstReplyCornerDistance(
        blackReplyFens,
        targetCorners,
      )
      if (
        currentCornerDistance === 1 &&
        keepsBlackOnAnyEdge(blackReplyFens) &&
        worstReplyCornerDistance <= currentCornerDistance
      ) {
        cornerTurnApplies = true
      }
      if (
        holdEdge &&
        move.piece === 'b' &&
        resultBishopsAdjacent &&
        resultArea < currentReachableArea
      ) {
        tightenWallApplies = true
      }
      if (holdEdge) {
        const resultBlockers = getCornerSupportBlockers(
          resultFen,
          targetCorners,
        )
        const resultSupportDistance = getCornerSupportDistance(
          resultFen,
          targetCorners,
        )
        const preservesCornerSetup =
          resultBlockers < currentCornerSupportBlockers ||
          (resultBlockers === currentCornerSupportBlockers &&
            resultSupportDistance <= currentCornerSupportDistance)
        if (preservesCornerSetup && currentCornerDistance <= 1) {
          const resultWhiteKing = findPiece(resultFen, 'w', 'k')
          const resultBlackKing = findPiece(resultFen, 'b', 'k')
          const resultKingTargetCornerDistance =
            getKingTargetCornerDistance(
              resultWhiteKing?.square,
              targetCorners,
            )
          const takesOpposition = Boolean(
            resultWhiteKing &&
              resultBlackKing &&
              hasDirectKingOpposition(
                resultWhiteKing.square,
                resultBlackKing.square,
              ),
          )
          if (
            resultArea <= currentReachableArea &&
            (resultBlockers < currentCornerSupportBlockers ||
              (resultBlockers === currentCornerSupportBlockers &&
                resultSupportDistance < currentCornerSupportDistance) ||
              resultKingTargetCornerDistance <
                currentKingTargetCornerDistance ||
              (currentCornerSupportBlockers === 0 &&
                currentCornerSupportDistance === 0 &&
                takesOpposition))
          ) {
            cornerSetupApplies = true
          }
        }
        if (worstReplyCornerDistance < currentCornerDistance) {
          cornerDriveApplies = true
        }
      }
    }

    if (
      move.piece === 'b' &&
      !afterWhite.isCheck() &&
      !afterWhite.isStalemate() &&
      !bishopCanBeCaptured
    ) {
      tempoMoveExists = true
      if (
        blackOnEdge &&
        beforeBlackKing &&
        beforeWhiteKing &&
        beforeBishopsAdjacent &&
        kingsAreTwoDiagonalSquaresApart(
          beforeWhiteKing.square,
          beforeBlackKing.square,
        ) &&
        squareColor(move.from) !== squareColor(beforeBlackKing.square) &&
        kingDistance(move.from, move.to) === 1 &&
        keepsBlackOnStartingEdge(
          beforeBlackKing.square,
          getBlackReplyFens(resultFen),
        )
      ) {
        edgeResetMoveExists = true
      }
    }

    if (kingApproachMove) {
      kingApproachApplies = true
    }
  }

  if (!forcedKingPushExists) {
    for (const candidate of advanceWallCandidates) {
      const advanceWall = getGuaranteedWallAdvance(
        candidate.resultFen,
        true,
        currentEdgeBishops,
        currentReachableArea,
      )
      if (!advanceWall) continue
      const prior = phaseOneMoveMetrics.get(candidate.san)!
      phaseOneMoveMetrics.set(candidate.san, {
        ...prior,
        advanceWallPenalty: 0,
        advanceWallWorstEdgeBishops: advanceWall.worstEdgeBishops,
        advanceWallWorstArea: advanceWall.worstArea,
      })
      advanceWallMoveExists = true
    }
  }

  const formWallApplies =
    !edgePhaseApplies &&
    !beforeBishopsAdjacent &&
    formWallMoveExists
  const pushKingApplies =
    !edgePhaseApplies &&
    !formWallApplies &&
    (beforeBishopsAdjacent
      ? forcedKingPushExists
      : kingApproachApplies)
  const advanceWallApplies =
    !edgePhaseApplies &&
    beforeBishopsAdjacent &&
    !pushKingApplies &&
    advanceWallMoveExists
  const cornerWaitingApplies =
    tempoMoveExists &&
    Boolean(
      beforeBlackKing &&
        (blackIsForcedTowardCorner(
          fen,
          beforeBlackKing.square,
          targetCorners,
        ) ||
          (currentCornerDistance === 0 &&
            currentCornerSupportDistance === 0) ||
          (edgePhaseApplies &&
            blackAlreadyConfined &&
            !cornerSetupApplies &&
            !cornerDriveApplies &&
            !tightenWallApplies &&
            !edgeSealMoveExists)),
    )

  const edgePlanApplies =
    blackOnEdge &&
    (cornerSetupApplies || cornerDriveApplies || tightenWallApplies)
  const edgeResetApplies =
    edgeResetMoveExists &&
    !cornerSetupApplies &&
    !cornerDriveApplies &&
    !tightenWallApplies

  return {
    cornerDriveApplies,
    cornerBishopDriveApplies:
      cornerDriveApplies && currentCornerSupportDistance === 0,
    cornerSetupApplies,
    cornerTurnApplies,
    cornerTurnSupportApplies:
      cornerTurnApplies && currentReachableArea <= 3,
    cornerWaitingApplies,
    cornerReadyWaitingApplies:
      tempoMoveExists &&
      currentCornerDistance === 0 &&
      currentCornerSupportDistance === 0,
    currentCornerSupportBlockers,
    currentCornerSupportDistance,
    currentReachableArea,
    edgePlanApplies,
    edgeResetApplies,
    midpointCheckApplies,
    kingApproachApplies,
    edgePhaseApplies,
    edgeSealApplies: edgeSealMoveExists,
    wallBuiltBefore: beforeBishopsAdjacent,
    formWallApplies,
    pushKingApplies,
    advanceWallApplies,
    phaseOneMoveMetrics,
    targetCorners,
    waitingApplies:
      tempoMoveExists &&
      !edgePhaseApplies &&
      !formWallApplies &&
      !pushKingApplies &&
      !advanceWallApplies,
    tempoApplies:
      tempoMoveExists &&
      !cornerSetupApplies &&
      !cornerDriveApplies &&
      !tightenWallApplies &&
      !kingApproachApplies,
    tightenWallApplies,
  }
}

function isEdgeMidpointSquare(square: Square): boolean {
  if (edgeDistance(square) !== 0 || isCornerSquare(square)) return false
  const distances = getCurrentEdgeCorners(square).map((corner) =>
    kingDistance(square, corner),
  )
  return (
    distances.length === 2 &&
    Math.abs(distances[0] - distances[1]) === 1
  )
}

function kingsAreTwoDiagonalSquaresApart(
  first: Square,
  second: Square,
): boolean {
  const firstCoordinates = squareCoordinates(first)
  const secondCoordinates = squareCoordinates(second)
  return (
    Math.abs(firstCoordinates.file - secondCoordinates.file) === 2 &&
    Math.abs(firstCoordinates.rank - secondCoordinates.rank) === 2
  )
}

function getBlackReplyFens(fen: string): string[] {
  return getChess(fen).moves().map((reply) => {
    const afterBlack = getChess(fen)
    afterBlack.move(reply)
    return afterBlack.fen()
  })
}

function blackCanCaptureBishopAfterWhiteMove(fen: string): boolean {
  return getChess(fen)
    .moves({ verbose: true })
    .some((move) => move.captured === 'b')
}

function getBlackDistanceFromBishopWall(
  fen: string,
  blackKing: Square,
): number {
  const bishops = getWhiteBishopSquares(fen)
  return bishops.length === 0
    ? 0
    : Math.min(
        ...bishops.map((bishop) => kingDistance(blackKing, bishop)),
      )
}

function getGuaranteedBlackWallDistance(afterWhiteFen: string): number {
  const replies = getBlackReplyFens(afterWhiteFen)
  if (replies.length === 0) return 0
  return Math.min(
    ...replies.map((replyFen) => {
      const blackKing = findPiece(replyFen, 'b', 'k')
      return blackKing
        ? getBlackDistanceFromBishopWall(replyFen, blackKing.square)
        : 0
    }),
  )
}

type GuaranteedWallAdvance = {
  readonly worstArea: number
  readonly worstEdgeBishops: number
}

function getGuaranteedWallAdvance(
  afterWhiteFen: string,
  eligibleLeadMove: boolean,
  currentEdgeBishops: number,
  currentArea: number,
): GuaranteedWallAdvance | undefined {
  if (!eligibleLeadMove) return undefined
  let immediate: GuaranteedWallAdvance | undefined
  if (whiteBishopsAreAdjacent(afterWhiteFen)) {
    const edgeBishops = getWhiteBishopSquares(afterWhiteFen).filter(
      (square) => edgeDistance(square) === 0,
    ).length
    const area = getBlackKingReachableArea(afterWhiteFen)
    if (
      area < currentArea ||
      edgeBishops < currentEdgeBishops
    ) {
      immediate = { worstArea: area, worstEdgeBishops: edgeBishops }
    }
  }
  const blackReplies = getBlackReplyFens(afterWhiteFen)
  if (blackReplies.length === 0) return immediate
  let worstArea = 0
  let worstEdgeBishops = 0
  for (const replyFen of blackReplies) {
    let best:
      | {
          area: number
          edgeBishops: number
        }
      | undefined
    for (const followup of getChess(replyFen).moves({ verbose: true })) {
      if (followup.piece !== 'b') continue
      const afterFollowup = getChess(replyFen)
      afterFollowup.move(followup.san)
      const followupFen = afterFollowup.fen()
      if (
        afterFollowup.isCheck() ||
        afterFollowup.isStalemate() ||
        blackCanCaptureBishopAfterWhiteMove(followupFen) ||
        !whiteBishopsAreAdjacent(followupFen)
      ) {
        continue
      }
      const edgeBishops = getWhiteBishopSquares(followupFen).filter(
        (square) => edgeDistance(square) === 0,
      ).length
      const area = getBlackKingReachableArea(followupFen)
      if (
        area >= currentArea &&
        edgeBishops >= currentEdgeBishops
      ) {
        continue
      }
      if (
        !best ||
        area < best.area ||
        (area === best.area && edgeBishops < best.edgeBishops)
      ) {
        best = { area, edgeBishops }
      }
    }
    if (!best) return immediate
    worstArea = Math.max(worstArea, best.area)
    worstEdgeBishops = Math.max(worstEdgeBishops, best.edgeBishops)
  }
  const rebuild = { worstArea, worstEdgeBishops }
  if (!immediate) return rebuild
  return rebuild.worstEdgeBishops < immediate.worstEdgeBishops ||
    (rebuild.worstEdgeBishops === immediate.worstEdgeBishops &&
      rebuild.worstArea < immediate.worstArea)
    ? rebuild
    : immediate
}

function keepsBlackOnStartingEdge(
  startingBlackKing: Square | undefined,
  replyFens: readonly string[],
): boolean {
  if (!startingBlackKing || replyFens.length === 0) return false
  return replyFens.every((replyFen) => {
    const blackKing = findPiece(replyFen, 'b', 'k')
    return Boolean(
      blackKing &&
        edgeDistance(blackKing.square) === 0 &&
        sharesAnyEdge(startingBlackKing, blackKing.square),
    )
  })
}

function keepsBlackOnAnyEdge(
  replyFens: readonly string[],
): boolean {
  if (replyFens.length === 0) return false
  return replyFens.every((replyFen) => {
    const blackKing = findPiece(replyFen, 'b', 'k')
    return Boolean(
      blackKing && edgeDistance(blackKing.square) === 0,
    )
  })
}

function blackIsConfinedToCurrentEdge(
  fen: string,
  blackKing: Square | undefined,
): boolean {
  if (!blackKing || edgeDistance(blackKing) !== 0) return false
  const moves = getChess(withFenTurn(fen, 'b'))
    .moves({ verbose: true })
    .filter((move) => move.from === blackKing)
  return (
    moves.length > 0 &&
    moves.every(
      (move) =>
        edgeDistance(move.to) === 0 &&
        sharesAnyEdge(blackKing, move.to),
    )
  )
}

function getTargetCorners(fen: string): Square[] {
  const blackKing = findPiece(fen, 'b', 'k')
  if (!blackKing || edgeDistance(blackKing.square) !== 0) {
    return []
  }
  if (isCornerSquare(blackKing.square)) return [blackKing.square]

  const corners = getCurrentEdgeCorners(blackKing.square)
  const blackDistances = corners.map((corner) =>
    kingDistance(blackKing.square, corner),
  )
  const whiteKing = findPiece(fen, 'w', 'k')
  if (
    corners.length === 2 &&
    whiteKing &&
    Math.abs(blackDistances[0]! - blackDistances[1]!) <= 1
  ) {
    const nearestWhiteDistance = Math.min(
      ...corners.map((corner) =>
        kingDistance(whiteKing.square, corner),
      ),
    )
    return corners.filter(
      (corner) =>
        kingDistance(whiteKing.square, corner) === nearestWhiteDistance,
    )
  }
  const nearestDistance = Math.min(...blackDistances)
  return corners.filter((corner) => {
    return kingDistance(blackKing.square, corner) === nearestDistance
  })
}

function blackIsForcedTowardCorner(
  fen: string,
  blackKing: Square,
  targetCorners: readonly Square[],
): boolean {
  if (targetCorners.length === 0) return false
  const moves = getChess(withFenTurn(fen, 'b'))
    .moves({ verbose: true })
    .filter((move) => move.from === blackKing)
  if (moves.length !== 1) return false
  const currentDistance = Math.min(
    ...targetCorners.map((corner) => kingDistance(blackKing, corner)),
  )
  return (
    edgeDistance(moves[0]!.to) === 0 &&
    Math.min(
      ...targetCorners.map((corner) =>
        kingDistance(moves[0]!.to, corner),
      ),
    ) < currentDistance
  )
}

function getCornerSupportSquares(corner: Square): Square[] {
  const { file, rank } = squareCoordinates(corner)
  return [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ].map(([fileOffset, rankOffset]) =>
    squareFromCoordinates(file + fileOffset, rank + rankOffset),
  ).filter((square): square is Square => square !== null)
}

function getCornerSupportBlockers(
  fen: string,
  targetCorners: readonly Square[],
): number {
  if (targetCorners.length === 0) return 0
  const supportSquares = new Set(targetCorners.flatMap(getCornerSupportSquares))
  return getWhiteBishopSquares(fen).filter((square) =>
    supportSquares.has(square),
  ).length
}

function getCornerSupportDistance(
  fen: string,
  targetCorners: readonly Square[],
): number {
  const whiteKing = findPiece(fen, 'w', 'k')
  if (!whiteKing || targetCorners.length === 0) return 0
  const chess = getChess(fen)
  const supportSquares = targetCorners
    .flatMap(getCornerSupportSquares)
    .filter(
      (square) =>
        square === whiteKing.square ||
        chess.get(square) === undefined,
    )
  if (supportSquares.length === 0) return 8
  return Math.min(
    ...supportSquares.map((square) =>
      kingDistance(whiteKing.square, square),
    ),
  )
}

function getKingTargetCornerDistance(
  whiteKing: Square | undefined,
  targetCorners: readonly Square[],
): number {
  if (!whiteKing || targetCorners.length === 0) return 0
  return Math.min(
    ...targetCorners.map((corner) => kingDistance(whiteKing, corner)),
  )
}

function getWorstReplyCornerDistance(
  replyFens: readonly string[],
  targetCorners: readonly Square[],
): number {
  if (replyFens.length === 0 || targetCorners.length === 0) return 0
  return Math.max(
    ...replyFens.map((replyFen) => {
      const blackKing = findPiece(replyFen, 'b', 'k')
      return blackKing
        ? Math.min(
            ...targetCorners.map((corner) =>
              kingDistance(blackKing.square, corner),
            ),
          )
        : 8
    }),
  )
}

function getWorstReplyKingDistance(
  replyFens: readonly string[],
  resultFen: string,
): number {
  const positions = replyFens.length > 0 ? replyFens : [resultFen]
  return Math.max(
    ...positions.map((fen) => {
      const whiteKing = findPiece(fen, 'w', 'k')
      const blackKing = findPiece(fen, 'b', 'k')
      return whiteKing && blackKing
        ? kingDistance(whiteKing.square, blackKing.square)
        : 8
    }),
  )
}

function getWorstReplyBishopBlackDistance(
  replyFens: readonly string[],
  resultFen: string,
): number {
  const positions = replyFens.length > 0 ? replyFens : [resultFen]
  return Math.max(
    ...positions.map((fen) => {
      const blackKing = findPiece(fen, 'b', 'k')
      if (!blackKing) return 16
      return getWhiteBishopSquares(fen).reduce(
        (distance, bishop) =>
          distance + kingDistance(bishop, blackKing.square),
        0,
      )
    }),
  )
}

function getBishopWhiteKingDistance(fen: string): number {
  const whiteKing = findPiece(fen, 'w', 'k')
  if (!whiteKing) return 16
  return getWhiteBishopSquares(fen).reduce(
    (distance, bishop) =>
      distance + kingDistance(bishop, whiteKing.square),
    0,
  )
}

function movesTowardSquare(
  from: Square,
  to: Square,
  target: Square,
): boolean {
  const start = squareCoordinates(from)
  const finish = squareCoordinates(to)
  const destination = squareCoordinates(target)
  const startFileDistance = Math.abs(start.file - destination.file)
  const startRankDistance = Math.abs(start.rank - destination.rank)
  const finishFileDistance = Math.abs(finish.file - destination.file)
  const finishRankDistance = Math.abs(finish.rank - destination.rank)
  return (
    finishFileDistance <= startFileDistance &&
    finishRankDistance <= startRankDistance &&
    (finishFileDistance < startFileDistance ||
      finishRankDistance < startRankDistance)
  )
}

function isCornerSquare(square: string): boolean {
  return (
    square === 'a1' ||
    square === 'a8' ||
    square === 'h1' ||
    square === 'h8'
  )
}

function allBlackRepliesAllowMateNext(fen: string): boolean {
  const replies = getChess(fen).moves()
  return (
    replies.length > 0 &&
    replies.every((reply) => {
      const afterBlack = getChess(fen)
      afterBlack.move(reply)
      return afterBlack.moves().some((whiteMove) => {
        const afterWhite = getChess(afterBlack.fen())
        afterWhite.move(whiteMove)
        return afterWhite.isCheckmate()
      })
    })
  )
}

export function compareTwoBishopsWhiteScores(
  first: TwoBishopsWhiteMoveScore,
  second: TwoBishopsWhiteMoveScore,
): number {
  return compareScoresByRules(first, second, twoBishopsWhiteRules)
}

function scoreWhiteCandidates(
  fen: string,
  moves: readonly string[],
): readonly ScoredMove<TwoBishopsWhiteMoveScore>[] {
  const context = createTwoBishopsPositionContext(fen)
  return moves.map((san) => ({
    san,
    score: scoreTwoBishopsWhiteMove(fen, san, context),
  }))
}

export function getIdealTwoBishopsWhiteMoves(fen: string): string[] {
  const chess = getChess(fen)
  const moves = chess.turn() === 'w' ? chess.moves() : []
  return [...selectIdealMoves(
    scoreWhiteCandidates(fen, moves),
    twoBishopsWhiteRules,
  )]
}

export function scoreTwoBishopsBlackMove(
  fen: string,
  san: string,
): TwoBishopsBlackMoveScore {
  const chess = getChess(fen)
  const move = chess.move(san)
  const blackKing = findPiece(chess.fen(), 'b', 'k')
  return {
    bishopCapturePenalty: move.captured === 'b' ? 0 : 1,
    centerDistance: blackKing ? centerDistance(blackKing.square) : 99,
    unprotectedBishopDistance: distanceToNearestUnprotectedWhiteBishop(
      chess.fen(),
    ),
  }
}

export function compareTwoBishopsBlackScores(
  first: TwoBishopsBlackMoveScore,
  second: TwoBishopsBlackMoveScore,
): number {
  return (
    first.bishopCapturePenalty - second.bishopCapturePenalty ||
    first.centerDistance - second.centerDistance ||
    first.unprotectedBishopDistance - second.unprotectedBishopDistance
  )
}

export function getIdealTwoBishopsBlackMoves(
  fen: string,
  moves: readonly string[] = getChess(fen).moves(),
): string[] {
  const firstMove = moves[0]
  if (!firstMove) return []
  const scored = moves.map((san) => ({
    san,
    score: scoreTwoBishopsBlackMove(fen, san),
  }))
  let best = scored[0]
  for (const candidate of scored.slice(1)) {
    if (compareTwoBishopsBlackScores(candidate.score, best.score) < 0) {
      best = candidate
    }
  }
  return scored
    .filter(
      (candidate) =>
        compareTwoBishopsBlackScores(candidate.score, best.score) === 0,
    )
    .map(({ san }) => san)
}

function getBlackCandidates(fen: string): OpponentCandidates {
  const moves = getChess(fen).moves()
  if (moves.length === 0) return { moves, idealMoves: [] }
  return {
    moves,
    idealMoves: getIdealTwoBishopsBlackMoves(fen, moves),
  }
}

function whiteLegalMoves(fen: string): readonly string[] {
  const chess = getChess(fen)
  return chess.turn() === 'w' ? chess.moves() : []
}

export const twoBishopsRuleSet: MateRuleSet<TwoBishopsWhiteMoveScore> = {
  id: 'two-bishops',
  phase: getTwoBishopsPhaseLabel,
  scoreWhite: scoreTwoBishopsWhiteMove,
  scoreWhiteCandidates,
  whiteRules: twoBishopsWhiteRules,
  whiteMoves: whiteLegalMoves,
  blackCandidates: getBlackCandidates,
  help: twoBishopsHelp,
}

export {
  getBlackKingFrontSquares,
  isTwoBishopsPhaseTwoPosition,
} from './twoBishopsGeometry'
export {
  getPhaseTwoCornerSupportDistance,
  getPhaseTwoControlledOppositionEdgeSquares,
} from './twoBishopsPhaseTwo'
export {
  getTwoBishopsAdjacentWallWaitingMoves,
  getTwoBishopsKnightDistanceWaitingMoves,
  getTwoBishopsPhaseOneOppositionWaitingMoves,
  getTwoBishopsPhaseTwoWaitingMoveTargets,
  getTwoBishopsSupportedCornerWaitingMoves,
} from './twoBishopsWaitingMoves'
