import {
  findPiece,
  getChess,
  kingDistance,
  manhattanDistance,
} from '../chess'
import { getEndgameReturnToPositionMoves } from './majorPieces'
import { compareScoresByRules, selectIdealMoves } from './selection'
import {
  centerDistance,
  distanceToNearestUnprotectedWhiteBishop,
  getBlackKingReachableArea,
  getTwoBishopsPhaseLabel,
  getWhiteBishopSquares,
  getWhiteKingBishopScreeningPenalty,
  whiteBishopsAreAdjacent,
} from './twoBishopsGeometry'
import {
  getTwoBishopsMatingSupportDistance,
  phaseTwoStayPhaseTwoPenalty,
  phaseTwoTakeDirectOppositionPenalty,
} from './twoBishopsPhaseTwo'
import {
  getTwoBishopsWaitingMoveContext,
  twoBishopsPhaseTwoWaitingMovePenalty,
  type TwoBishopsWaitingMoveContext,
} from './twoBishopsWaitingMoves'
import {
  getTwoBishopsProofDistance,
  isTwoBishopsProofProgress,
} from './twoBishopsProof'
import type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RuleHelp,
  ScoredMove,
} from './types'

export type TwoBishopsWhiteMoveScore = {
  readonly matePenalty: number
  readonly stalematePenalty: number
  readonly bishopSafetyPenalty: number
  readonly proofProgressPenalty: number
  readonly proofWorstReplyDistance: number
  readonly phaseTwoStayPhaseTwoPenalty: number
  readonly phaseTwoWaitingMovePenalty: number
  readonly matingSupportDistance: number | null
  readonly phaseTwoTakeDirectOppositionPenalty: number
  readonly kingBishopScreeningPenalty: number
  readonly bishopAdjacencyPenalty: number
  readonly blackKingReachableArea: number
  readonly whiteBlackKingDistance: number
  readonly whiteBlackKingManhattanDistance: number
}

export type TwoBishopsBlackMoveScore = {
  readonly bishopCapturePenalty: number
  readonly centerDistance: number
  readonly unprotectedBishopDistance: number
}

type TwoBishopsProofPrefix = Pick<
  TwoBishopsWhiteMoveScore,
  | 'matePenalty'
  | 'stalematePenalty'
  | 'bishopSafetyPenalty'
  | 'proofProgressPenalty'
  | 'proofWorstReplyDistance'
>

const WHITE_INTRO =
  "White's best moves are the moves that survive these priorities in order. If several moves are still tied after a priority, they all remain best moves."

const BLACK_INTRO =
  'Black uses its own priorities to put up the strongest resistance. Black is not trying to help the mate; it looks for the most stubborn legal reply.'
const FINISH_GUARANTEE_HELP =
  'Every recommended move keeps mate forced and rules out repetition or a fifty-move draw.'
const WAITING_MOVE_HELP =
  "When White's king holds Black back, keep the wall with a quiet bishop move so Black must give ground. Near a corner, move the bishop that controls that corner first."
const CORNER_FINISH_HELP =
  "Drive Black to the edge and keep it there. Put White's king a knight's move from the mating corner, then take direct opposition."
const BISHOP_WALL_HELP =
  "Keep White's king clear of the bishops' lines. Place the bishops side by side, then shrink Black's room."

const twoBishopsHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: WHITE_INTRO,
  blackIntro: BLACK_INTRO,
  blackPriorities: [
    'Return to the previous board position when a legal reply can recreate it.',
    "Take a piece if White isn't looking.",
    'Move toward the center.',
    'Move toward an unprotected bishop.',
  ],
  notes: [
    "Phase 2 begins when Black's king is on an edge and White's king controls at least two squares in front of it. The diagonal approach that forces Black along the edge also counts.",
  ],
  noteBoards: [
    {
      id: 'bishop-wall',
      title: 'bishop wall',
      caption:
        "Keep the bishops beside each other so their diagonals form one wall and shrink Black's room.",
      layout: { files: 6, ranks: 6, fileOffset: 0 },
      pieces: [
        { square: 'b1', piece: 'K' },
        { square: 'c2', piece: 'B' },
        { square: 'd2', piece: 'B' },
        { square: 'f6', piece: 'k' },
      ],
      highlights: [
        'd3',
        'e4',
        'f5',
        'e3',
        'f4',
      ].map((square) => ({ square, kind: 'wall' as const })),
    },
    {
      id: 'bishop-corner-finish',
      title: 'corner finish',
      caption:
        "The king supports from a knight's move away while the bishop wall covers the corner and last escape.",
      layout: { files: 5, ranks: 5, fileOffset: 0 },
      pieces: [
        { square: 'b3', piece: 'K' },
        { square: 'd4', piece: 'B' },
        { square: 'e4', piece: 'B' },
        { square: 'a1', piece: 'k' },
      ],
      highlights: [
        { square: 'a2', kind: 'support' },
        { square: 'b2', kind: 'support' },
        { square: 'b3', kind: 'support' },
        { square: 'a1', kind: 'wall' },
        { square: 'b1', kind: 'wall' },
      ],
    },
  ],
}

function scoreTwoBishopsProofPrefix(
  fen: string,
  san: string,
  waitingMoveContext: TwoBishopsWaitingMoveContext,
): TwoBishopsProofPrefix {
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const currentProofDistance = getTwoBishopsProofDistance(fen)
  const replyProofDistances = chess.moves().map((reply) => {
    const afterBlack = getChess(resultFen)
    afterBlack.move(reply)
    return getTwoBishopsProofDistance(afterBlack.fen())
  })
  const proofWorstReplyDistance = chess.isCheckmate()
    ? 0
    : replyProofDistances.length > 0 &&
        replyProofDistances.every((distance) => distance !== null)
      ? Math.max(...replyProofDistances)
      : 255
  const isSupportedCornerWaitingMove = waitingMoveContext.supportedCornerMoves.some(
    (candidate) => candidate.from === move.from && candidate.to === move.to,
  )
  const startingBishops = getWhiteBishopSquares(fen)
  const resultBishops = getWhiteBishopSquares(resultFen)
  const startingBishopDistance =
    startingBishops.length === 2
      ? kingDistance(startingBishops[0], startingBishops[1])
      : 99
  const resultingBishopDistance =
    resultBishops.length === 2
      ? kingDistance(resultBishops[0], resultBishops[1])
      : 99
  return {
    matePenalty: chess.isCheckmate() ? 0 : 1,
    stalematePenalty: !chess.isCheckmate() && chess.isStalemate() ? 1 : 0,
    bishopSafetyPenalty: replyProofDistances.some(
      (distance) => distance === null,
    )
      ? 1
      : 0,
    proofProgressPenalty:
      chess.isCheckmate() ||
      isTwoBishopsProofProgress({
        currentDistance: currentProofDistance,
        worstReplyDistance: proofWorstReplyDistance,
        supportedCornerWait: isSupportedCornerWaitingMove,
        startingBishopDistance,
        resultingBishopDistance,
      })
        ? 0
        : 1,
    proofWorstReplyDistance,
  }
}

export function scoreTwoBishopsWhiteMove(
  fen: string,
  san: string,
  waitingMoveContext: TwoBishopsWaitingMoveContext =
    getTwoBishopsWaitingMoveContext(fen),
  proofPrefix: TwoBishopsProofPrefix = scoreTwoBishopsProofPrefix(
    fen,
    san,
    waitingMoveContext,
  ),
): TwoBishopsWhiteMoveScore {
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const blackKing = findPiece(resultFen, 'b', 'k')
  const whiteKing = findPiece(resultFen, 'w', 'k')
  return {
    ...proofPrefix,
    phaseTwoStayPhaseTwoPenalty: phaseTwoStayPhaseTwoPenalty(fen, resultFen),
    phaseTwoWaitingMovePenalty: twoBishopsPhaseTwoWaitingMovePenalty(
      move.from,
      move.to,
      waitingMoveContext,
    ),
    matingSupportDistance: getTwoBishopsMatingSupportDistance(
      fen,
      resultFen,
    ),
    phaseTwoTakeDirectOppositionPenalty:
      phaseTwoTakeDirectOppositionPenalty(fen, resultFen),
    kingBishopScreeningPenalty: getWhiteKingBishopScreeningPenalty(resultFen),
    bishopAdjacencyPenalty: whiteBishopsAreAdjacent(resultFen) ? 0 : 1,
    blackKingReachableArea: getBlackKingReachableArea(resultFen),
    whiteBlackKingDistance:
      whiteKing && blackKing
        ? kingDistance(whiteKing.square, blackKing.square)
        : 99,
    whiteBlackKingManhattanDistance:
      whiteKing && blackKing
        ? manhattanDistance(whiteKing.square, blackKing.square)
        : 99,
  }
}

export const twoBishopsWhiteRules: readonly OrderedRule<TwoBishopsWhiteMoveScore>[] = [
  {
    id: 'mate',
    shortLabel: 'mate',
    guideOrder: 0,
    helpText: '',
    stopWhenBest: (score) => score.matePenalty === 0,
    compare: (first, second) => first.matePenalty - second.matePenalty,
  },
  {
    id: 'bishops safe',
    shortLabel: 'pieces safe',
    guideOrder: 1,
    helpText: '',
    compare: (first, second) =>
      first.bishopSafetyPenalty - second.bishopSafetyPenalty,
  },
  {
    id: 'no stalemate',
    shortLabel: 'no stalemate',
    guideOrder: 2,
    helpText: '',
    compare: (first, second) =>
      first.stalematePenalty - second.stalematePenalty,
  },
  {
    id: 'finish guarantee',
    shortLabel: 'finish guarantee',
    helpText: FINISH_GUARANTEE_HELP,
    presentationRole: 'guard',
    compare: (first, second) =>
      first.proofProgressPenalty - second.proofProgressPenalty,
  },
  {
    id: 'waiting move',
    shortLabel: 'waiting move',
    helpText: WAITING_MOVE_HELP,
    compare: (first, second) =>
      first.phaseTwoWaitingMovePenalty - second.phaseTwoWaitingMovePenalty,
  },
  {
    id: 'corner finish',
    shortLabel: 'corner finish',
    helpText: CORNER_FINISH_HELP,
    applies: (score) => score.matingSupportDistance !== null,
    compare: (first, second) =>
      (first.matingSupportDistance ?? 0) -
        (second.matingSupportDistance ?? 0) ||
      first.phaseTwoStayPhaseTwoPenalty -
        second.phaseTwoStayPhaseTwoPenalty,
  },
  {
    id: 'corner finish',
    shortLabel: 'corner finish',
    helpText: CORNER_FINISH_HELP,
    compare: (first, second) =>
      first.phaseTwoStayPhaseTwoPenalty -
      second.phaseTwoStayPhaseTwoPenalty,
  },
  {
    id: 'corner finish',
    shortLabel: 'corner finish',
    helpText: CORNER_FINISH_HELP,
    compare: (first, second) =>
      first.phaseTwoTakeDirectOppositionPenalty -
      second.phaseTwoTakeDirectOppositionPenalty,
  },
  {
    id: 'bishop wall',
    shortLabel: 'bishop wall',
    helpText: BISHOP_WALL_HELP,
    compare: (first, second) =>
      first.kingBishopScreeningPenalty - second.kingBishopScreeningPenalty,
  },
  {
    id: 'bishop wall',
    shortLabel: 'bishop wall',
    helpText: BISHOP_WALL_HELP,
    compare: (first, second) =>
      first.bishopAdjacencyPenalty - second.bishopAdjacencyPenalty,
  },
  {
    id: 'bishop wall',
    shortLabel: 'bishop wall',
    helpText: BISHOP_WALL_HELP,
    compare: (first, second) =>
      first.blackKingReachableArea - second.blackKingReachableArea,
  },
  {
    id: 'king closer',
    shortLabel: 'king closer',
    helpText: "Move White's king closer to Black's king.",
    compare: (first, second) =>
      first.whiteBlackKingDistance - second.whiteBlackKingDistance ||
      first.whiteBlackKingManhattanDistance -
        second.whiteBlackKingManhattanDistance,
  },
]

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
  const waitingMoveContext = getTwoBishopsWaitingMoveContext(fen)
  const prefixed = moves.map((san) => ({
    san,
    score: scoreTwoBishopsProofPrefix(fen, san, waitingMoveContext),
  }))
  let prefixSurvivors = [...prefixed]
  for (const field of [
    'matePenalty',
    'bishopSafetyPenalty',
    'stalematePenalty',
    'proofProgressPenalty',
  ] as const) {
    const best = Math.min(
      ...prefixSurvivors.map(({ score }) => score[field]),
    )
    prefixSurvivors = prefixSurvivors.filter(
      ({ score }) => score[field] === best,
    )
    if (field === 'matePenalty' && best === 0) break
  }
  const survivingMoves = new Set(prefixSurvivors.map(({ san }) => san))
  const completed = new Map(
    prefixed
      .filter(({ san }) => survivingMoves.has(san))
      .map(({ san, score }) => [
        san,
        scoreTwoBishopsWhiteMove(fen, san, waitingMoveContext, score),
      ]),
  )
  const neutralSuffix = completed.values().next().value
  if (!neutralSuffix) return []
  return prefixed.map(({ san, score }) => ({
    san,
    score: completed.get(san) ?? { ...neutralSuffix, ...score },
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

function getBlackCandidates(
  fen: string,
  previousTurnFen?: string,
): OpponentCandidates {
  const moves = getChess(fen).moves()
  if (moves.length === 0) return { moves, idealMoves: [] }
  const returnMoves = getEndgameReturnToPositionMoves(
    fen,
    previousTurnFen,
    moves,
  )
  return {
    moves,
    idealMoves:
      returnMoves.length > 0
        ? returnMoves
        : getIdealTwoBishopsBlackMoves(fen, moves),
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
