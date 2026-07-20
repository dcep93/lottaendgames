import { edgeDistance, findPiece, getChess } from '../chess'
import { getEndgameReturnToPositionMoves } from './majorPieces'
import { compareScoresByRules, selectIdealMoves } from './selection'
import {
  blackCanTakeWhiteBishops,
  blackCanWalkUpToWhiteBishop,
  centerDistance,
  distanceToNearestUnprotectedWhiteBishop,
  getTwoBishopsPhaseLabel,
  getWhiteBishopDistanceToSquare,
  getWhiteKingBishopScreeningPenalty,
  getWhiteKingDistanceToBishops,
  whiteBishopsAreAdjacent,
} from './twoBishopsGeometry'
import {
  phaseTwoBishopCornerDistance,
  phaseTwoCheckPenalty,
  phaseTwoForceOpponentCornerPenalty,
  phaseTwoForceOpponentOppositionPenalty,
  phaseTwoPushFromControlledEdgeSquarePenalty,
  phaseTwoStayPhaseTwoPenalty,
  phaseTwoTakeDirectOppositionPenalty,
} from './twoBishopsPhaseTwo'
import {
  getTwoBishopsWaitingMoveContext,
  twoBishopsPhaseTwoWaitingMovePenalty,
  type TwoBishopsWaitingMoveContext,
} from './twoBishopsWaitingMoves'
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
  readonly phaseTwoStayPhaseTwoPenalty: number
  readonly phaseTwoWaitingMovePenalty: number
  readonly phaseTwoForceOpponentOppositionPenalty: number
  readonly phaseTwoTakeDirectOppositionPenalty: number
  readonly phaseTwoPushFromControlledEdgeSquarePenalty: number
  readonly phaseTwoForceOpponentCornerPenalty: number
  readonly phaseTwoCheckPenalty: number
  readonly phaseTwoBishopCornerDistance: number
  readonly kingBishopScreeningPenalty: number
  readonly bishopAdjacencyPenalty: number
  readonly kingBishopDistance: number
  readonly blackKingEdgeDistance: number
  readonly bishopBlackKingDistance: number
}

export type TwoBishopsBlackMoveScore = {
  readonly centerDistance: number
  readonly unprotectedBishopDistance: number
}

const WHITE_INTRO =
  "White's best moves are the moves that survive these priorities in order. If several moves are still tied after a priority, they all remain best moves."

const BLACK_INTRO =
  'Black uses its own priorities to put up the strongest resistance. Black is not trying to help the mate; it looks for the most stubborn legal reply.'

const twoBishopsHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: WHITE_INTRO,
  blackIntro: BLACK_INTRO,
  blackPriorities: [
    'Return to the previous full position when a legal reply can recreate it.',
    'Stay away from edges and corners, preferring the center.',
    'Among equally central moves, take an unprotected bishop when possible; otherwise move toward the nearest unprotected bishop.',
  ],
  notes: [
    "Phase 2 is where Black's king is on an edge and White's king controls at least 2 squares in front of Black's king. Phase 2 also includes positions where White's king is two diagonal king moves from Black's edge king and Black is forced to move along the edge toward White's king. Squares in front are the squares opposite an edge: edge squares have 3 squares in front of them. Corner front squares are the 3 inward squares, such as a2 and b1 and b2 when Black's king is on a1.",
    "The phase 2 waiting move is not any quiet move. It is a bishop move for a boxed-in king: either the line-pattern waiting move that keeps the wall, or the corner waiting move that lets that bishop cover Black's single escape square after Black moves.",
  ],
  noteBoards: [],
}

export function scoreTwoBishopsWhiteMove(
  fen: string,
  san: string,
  waitingMoveContext: TwoBishopsWaitingMoveContext =
    getTwoBishopsWaitingMoveContext(fen),
): TwoBishopsWhiteMoveScore {
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const whiteKing = findPiece(resultFen, 'w', 'k')
  const blackKing = findPiece(resultFen, 'b', 'k')
  return {
    matePenalty: chess.isCheckmate() ? 0 : 1,
    stalematePenalty: !chess.isCheckmate() && chess.isStalemate() ? 1 : 0,
    bishopSafetyPenalty:
      blackCanTakeWhiteBishops(resultFen) ||
      blackCanWalkUpToWhiteBishop(resultFen)
        ? 1
        : 0,
    phaseTwoStayPhaseTwoPenalty: phaseTwoStayPhaseTwoPenalty(fen, resultFen),
    phaseTwoWaitingMovePenalty: twoBishopsPhaseTwoWaitingMovePenalty(
      move.from,
      move.to,
      waitingMoveContext,
    ),
    phaseTwoForceOpponentOppositionPenalty:
      phaseTwoForceOpponentOppositionPenalty(fen, resultFen),
    phaseTwoTakeDirectOppositionPenalty:
      phaseTwoTakeDirectOppositionPenalty(fen, resultFen),
    phaseTwoPushFromControlledEdgeSquarePenalty:
      phaseTwoPushFromControlledEdgeSquarePenalty(fen, resultFen),
    phaseTwoForceOpponentCornerPenalty: phaseTwoForceOpponentCornerPenalty(
      fen,
      resultFen,
    ),
    phaseTwoCheckPenalty: phaseTwoCheckPenalty(fen, resultFen),
    phaseTwoBishopCornerDistance: phaseTwoBishopCornerDistance(fen, resultFen),
    kingBishopScreeningPenalty:
      getWhiteKingBishopScreeningPenalty(resultFen),
    bishopAdjacencyPenalty: whiteBishopsAreAdjacent(resultFen) ? 0 : 1,
    kingBishopDistance: whiteKing
      ? getWhiteKingDistanceToBishops(resultFen, whiteKing.square)
      : 99,
    blackKingEdgeDistance: blackKing ? edgeDistance(blackKing.square) : 99,
    bishopBlackKingDistance: blackKing
      ? getWhiteBishopDistanceToSquare(resultFen, blackKing.square)
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
    id: 'no stalemate',
    shortLabel: 'no stalemate',
    guideOrder: 2,
    helpText: '',
    compare: (first, second) =>
      first.stalematePenalty - second.stalematePenalty,
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
    id: 'stay phase two',
    shortLabel: 'stay phase two',
    helpText: 'Enter or remain in phase 2.',
    compare: (first, second) =>
      first.phaseTwoStayPhaseTwoPenalty -
      second.phaseTwoStayPhaseTwoPenalty,
  },
  {
    id: 'waiting move',
    shortLabel: 'waiting move',
    helpText:
      'Phase 2: use the specific bishop waiting move when Black is boxed in.',
    compare: (first, second) =>
      first.phaseTwoWaitingMovePenalty - second.phaseTwoWaitingMovePenalty,
  },
  {
    id: 'force opponent to take opposition',
    shortLabel: 'force opponent to take opposition',
    helpText:
      "Phase 2: force Black along the edge toward direct king opposition without moving the bishop on the black king's current color, unless it's a check.",
    compare: (first, second) =>
      first.phaseTwoForceOpponentOppositionPenalty -
      second.phaseTwoForceOpponentOppositionPenalty,
  },
  {
    id: 'take direct opposition',
    shortLabel: 'take direct opposition',
    helpText:
      'Phase 2: take direct king opposition, unless it moves the white king into a square controlled by a bishop.',
    compare: (first, second) =>
      first.phaseTwoTakeDirectOppositionPenalty -
      second.phaseTwoTakeDirectOppositionPenalty,
  },
  {
    id: 'push from controlled edge square',
    shortLabel: 'push from controlled edge square',
    helpText:
      "Phase 2: when the kings are in direct opposition and a bishop controls the edge square two squares from Black's king and diagonally two squares from White's king, force Black's king away from that controlled edge square.",
    compare: (first, second) =>
      first.phaseTwoPushFromControlledEdgeSquarePenalty -
      second.phaseTwoPushFromControlledEdgeSquarePenalty,
  },
  {
    id: 'force opponent toward corner',
    shortLabel: 'force opponent toward corner',
    helpText:
      "Phase 2: force Black towards the corner along its current edge and closer to White's king.",
    compare: (first, second) =>
      first.phaseTwoForceOpponentCornerPenalty -
      second.phaseTwoForceOpponentCornerPenalty,
  },
  {
    id: 'check king',
    shortLabel: 'check king',
    helpText: 'Phase 2: Check the king.',
    compare: (first, second) =>
      first.phaseTwoCheckPenalty - second.phaseTwoCheckPenalty,
  },
  {
    id: 'bishops far from corner',
    shortLabel: 'bishops farther from corner',
    helpText:
      "Phase 2: Prefer bishops to be farther from the corner closest to Black's king.",
    compare: (first, second) =>
      second.phaseTwoBishopCornerDistance -
      first.phaseTwoBishopCornerDistance,
  },
  {
    id: 'avoid king bishop screening',
    shortLabel: 'avoid king bishop screening',
    helpText:
      "Keep White's king and bishops from screening each other from Black's king.",
    compare: (first, second) =>
      first.kingBishopScreeningPenalty - second.kingBishopScreeningPenalty,
  },
  {
    id: 'bishops together',
    shortLabel: 'bishops together',
    helpText: 'Keep the bishops adjacent.',
    compare: (first, second) =>
      first.bishopAdjacencyPenalty - second.bishopAdjacencyPenalty,
  },
  {
    id: 'king near bishops',
    shortLabel: 'king near bishops',
    helpText: "Keep White's king near the bishops.",
    compare: (first, second) =>
      first.kingBishopDistance - second.kingBishopDistance,
  },
  {
    id: 'force black to edge',
    shortLabel: 'force black to edge',
    helpText: 'Force Black to the edge.',
    compare: (first, second) =>
      first.blackKingEdgeDistance - second.blackKingEdgeDistance,
  },
  {
    id: 'bishops closer',
    shortLabel: 'bishops closer to black king',
    helpText: "Bring the bishops closer to Black's king.",
    compare: (first, second) =>
      first.bishopBlackKingDistance - second.bishopBlackKingDistance,
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
  return moves.map((san) => ({
    san,
    score: scoreTwoBishopsWhiteMove(fen, san, waitingMoveContext),
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
    centerDistance: blackKing ? centerDistance(blackKing.square) : 99,
    unprotectedBishopDistance:
      move.captured === 'b'
        ? 0
        : distanceToNearestUnprotectedWhiteBishop(chess.fen()),
  }
}

export function compareTwoBishopsBlackScores(
  first: TwoBishopsBlackMoveScore,
  second: TwoBishopsBlackMoveScore,
): number {
  return (
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
export { getPhaseTwoControlledOppositionEdgeSquares } from './twoBishopsPhaseTwo'
export {
  getTwoBishopsCornerWaitingMoves,
  getTwoBishopsPhaseTwoWaitingMoveTargets,
} from './twoBishopsWaitingMoves'
