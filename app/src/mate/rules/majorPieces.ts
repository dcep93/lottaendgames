import {
  edgeDistance,
  findPiece,
  getChess,
  hasDirectKingOpposition,
  isDiagonalKingMove,
  isKnightMove,
  kingDistance,
  kingWalkCenterDistance,
  manhattanDistance,
  middle2x2Distance,
  positionKey,
  sharesRankOrFile,
  squareCoordinates,
} from '../chess'
import {
  blackCanTakeWhiteMajorPiece,
  blackMustMoveAwayFromWhiteKing,
  getAxisDistance,
  getClosestRookBoxAxis,
  getMajorEndgamePhase,
  getMajorEndgamePhaseLabel,
  getQueenBoxArea,
  getQueenCageKingApproachDistance,
  getQueenCageKingApproachManhattanDistance,
  getQueenMoveDistance,
  getQueenTwoSquareCage,
  getRookCutAxis,
  getRookEstablishedBoxAxis,
  getRookOneDimensionalBoxSize,
  isMajorPieceBetweenKings,
} from './majorPieceGeometry'
import { compareScoresByRules, selectIdealMoves } from './selection'
import type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RuleHelp,
} from './types'

export type QueenWhiteMoveScore = {
  readonly matePenalty: number
  readonly queenCapturePenalty: number
  readonly stalematePenalty: number
  readonly cagePenalty: number
  readonly whitePieceEdgePenalty: number
  readonly queenKnightMovePenalty: number
  readonly queenBoxArea: number
  readonly cageKingApproach: number
  readonly kingMiddleDistance: number
  readonly whiteKingBetweenPiecesPenalty: number
  readonly kingDistance: number
  readonly queenMoveDistance: number | null
}

export type QueenBlackMoveScore = {
  readonly captureQueenPenalty: number
  readonly centerDistance: number
}

export type RookWhiteMoveScore = {
  readonly matePenalty: number
  readonly rookCapturePenalty: number
  readonly stalematePenalty: number
  readonly rookBoxEstablishedPenalty: number
  readonly rookBoxAxisSwitchPenalty: number
  readonly rookBoxSize: number
  readonly forcingCheckPenalty: number
  readonly rookPhaseTwoWaitingPenalty: number
  readonly rookPhaseTwoWaitingDistanceScore: number
  readonly rookBoxPreservedPenalty: number
  readonly rookPreservedBoxSize: number
  readonly rookBlackDistanceScore: number
  readonly kingRookLinePenalty: number
  readonly kingDistance: number
}

export type RookBlackMoveScore = {
  readonly captureRookPenalty: number
  readonly cutLineDistance: number
  readonly diagonalAdjacentRookDistance: number
  readonly rookOppositionPenalty: number
  readonly rookDistance: number
}

const WHITE_INTRO =
  "White's best moves are the moves that survive these priorities in order. If several moves are still tied after a priority, they all remain best moves."

const BLACK_INTRO =
  'Black uses its own priorities to put up the strongest resistance. Black is not trying to help the mate; it looks for the most stubborn legal reply.'

const RETURN_POSITION_PRIORITY =
  'Return to the previous full position when a legal reply can recreate it.'

const queenHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: WHITE_INTRO,
  blackIntro: BLACK_INTRO,
  blackPriorities: [
    RETURN_POSITION_PRIORITY,
    "Take a piece if White isn't looking.",
    'Head toward the center, where Black has the most room to resist.',
  ],
  notes: [],
  noteBoards: [],
}

const rookHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: WHITE_INTRO,
  blackIntro: BLACK_INTRO,
  blackPriorities: [
    RETURN_POSITION_PRIORITY,
    "Take a piece if White isn't looking.",
    "Move toward the rook's cut line when that weakens White's box.",
    "Approach a diagonally protected rook when White's king and rook are awkwardly placed.",
    "Avoid walking into direct opposition when it makes White's job easier.",
    'Get as close to the rook as possible.',
  ],
  notes: [],
  noteBoards: [],
}

function selectBestMoves<Score>(
  moves: readonly string[],
  scoreMove: (san: string) => Score,
  compareScores: (first: Score, second: Score) => number,
): string[] {
  const firstMove = moves[0]
  if (firstMove === undefined) {
    return []
  }
  const scoredMoves = moves.map((san) => ({ san, score: scoreMove(san) }))
  let bestScore = scoredMoves[0].score
  for (const candidate of scoredMoves.slice(1)) {
    if (compareScores(candidate.score, bestScore) < 0) {
      bestScore = candidate.score
    }
  }
  return scoredMoves
    .filter((candidate) => compareScores(candidate.score, bestScore) === 0)
    .map(({ san }) => san)
}

export function scoreQueenWhiteMove(
  fen: string,
  san: string,
): QueenWhiteMoveScore {
  const beforeQueen = findPiece(fen, 'w', 'q')
  const startingCage = getQueenTwoSquareCage(fen, 'b')
  const shouldWalkCageKing = startingCage !== null
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const whiteQueen = findPiece(resultFen, 'w', 'q')
  const whiteKing = findPiece(resultFen, 'w', 'k')
  const blackKing = findPiece(resultFen, 'b', 'k')
  const resultCage = getQueenTwoSquareCage(resultFen)
  return {
    matePenalty: chess.isCheckmate() ? 0 : 1,
    queenCapturePenalty: blackCanTakeWhiteMajorPiece(resultFen, 'q') ? 1 : 0,
    stalematePenalty: !chess.isCheckmate() && chess.isStalemate() ? 1 : 0,
    cagePenalty: resultCage ? 0 : 1,
    whitePieceEdgePenalty: [whiteQueen, whiteKing].filter(
      (piece) => piece && edgeDistance(piece.square) === 0,
    ).length,
    queenKnightMovePenalty:
      whiteQueen &&
      blackKing &&
      isKnightMove(whiteQueen.square, blackKing.square)
        ? 0
        : 1,
    queenBoxArea:
      whiteQueen && blackKing
        ? getQueenBoxArea(whiteQueen.square, blackKing.square)
        : 99,
    cageKingApproach:
      shouldWalkCageKing && resultCage && whiteKing && whiteQueen
        ? move.piece === 'k'
          ? getQueenCageKingApproachDistance(
              whiteKing.square,
              whiteQueen.square,
              startingCage.corner,
            ) *
              8 +
            getQueenCageKingApproachManhattanDistance(
              whiteKing.square,
              whiteQueen.square,
              startingCage.corner,
            )
          : 99
        : 0,
    kingMiddleDistance: whiteKing ? middle2x2Distance(whiteKing.square) : 99,
    whiteKingBetweenPiecesPenalty:
      move.piece === 'k' &&
      whiteQueen &&
      whiteKing &&
      blackKing &&
      isMajorPieceBetweenKings(whiteKing, whiteQueen, blackKing)
        ? 1
        : 0,
    kingDistance:
      whiteKing && blackKing
        ? manhattanDistance(whiteKing.square, blackKing.square)
        : 99,
    queenMoveDistance: getQueenMoveDistance(
      beforeQueen?.square,
      whiteQueen?.square,
      move.piece,
    ),
  }
}

export const queenWhiteRules: readonly OrderedRule<QueenWhiteMoveScore>[] = [
  {
    id: 'mate',
    shortLabel: 'mate',
    helpText: '',
    compare: (first, second) => first.matePenalty - second.matePenalty,
  },
  {
    id: 'queen safe',
    shortLabel: 'pieces safe',
    helpText: '',
    compare: (first, second) =>
      first.queenCapturePenalty - second.queenCapturePenalty,
  },
  {
    id: 'no stalemate',
    shortLabel: 'no stalemate',
    helpText: '',
    compare: (first, second) =>
      first.stalematePenalty - second.stalematePenalty,
  },
  {
    id: 'corner cage',
    shortLabel: 'corner cage',
    helpText: "Build or preserve the queen's corner cage.",
    compare: (first, second) => first.cagePenalty - second.cagePenalty,
  },
  {
    id: 'king to cage',
    shortLabel: 'White king toward cage',
    helpText:
      "When the queen has a two-square corner cage, walk White's king toward that cage.",
    compare: (first, second) =>
      first.cageKingApproach - second.cageKingApproach,
  },
  {
    id: 'white pieces off edge',
    shortLabel: 'white pieces off edge',
    helpText: 'Keep white pieces off edge squares.',
    compare: (first, second) =>
      first.whitePieceEdgePenalty - second.whitePieceEdgePenalty,
  },
  {
    id: 'queen knight move',
    shortLabel: 'queen a knight move from Black king',
    helpText: "Place the queen a knight move from Black's king.",
    compare: (first, second) =>
      first.queenKnightMovePenalty - second.queenKnightMovePenalty,
  },
  {
    id: 'queen box size',
    shortLabel: 'queen box size',
    helpText: "Shrink the queen's box around Black's king.",
    compare: (first, second) => first.queenBoxArea - second.queenBoxArea,
  },
  {
    id: 'king closer',
    shortLabel: 'White king closer',
    helpText:
      "Bring White's king closer to Black's king without walking between the queen and Black's king.",
    compare: (first, second) =>
      first.whiteKingBetweenPiecesPenalty -
        second.whiteKingBetweenPiecesPenalty ||
      first.kingDistance - second.kingDistance,
  },
  {
    id: 'shorter queen move',
    shortLabel: 'shorter queen move',
    helpText: 'Prefer the shorter queen move when everything else is tied.',
    applies: (score) => score.queenMoveDistance !== null,
    compare: (first, second) =>
      first.queenMoveDistance! - second.queenMoveDistance!,
  },
]

export function compareQueenWhiteScores(
  first: QueenWhiteMoveScore,
  second: QueenWhiteMoveScore,
): number {
  return compareScoresByRules(first, second, queenWhiteRules)
}

export function getIdealQueenWhiteMoves(fen: string): string[] {
  const chess = getChess(fen)
  const moves = chess.moves()
  if (chess.turn() !== 'w' || moves.length === 0) {
    return moves
  }
  return [...selectIdealMoves(
    moves.map((san) => ({ san, score: scoreQueenWhiteMove(fen, san) })),
    queenWhiteRules,
  )]
}

export function scoreRookWhiteMove(
  fen: string,
  san: string,
): RookWhiteMoveScore {
  const beforeRook = findPiece(fen, 'w', 'r')
  const beforeWhiteKing = findPiece(fen, 'w', 'k')
  const beforeBlackKing = findPiece(fen, 'b', 'k')
  const beforeRookBoxAxis = getRookEstablishedBoxAxis(fen)
  const beforeClosestRookBoxAxis =
    beforeRook && beforeWhiteKing && beforeBlackKing
      ? getClosestRookBoxAxis(beforeRook, beforeWhiteKing, beforeBlackKing)
      : null
  const beforeClosestRookBoxSize =
    beforeRook && beforeBlackKing && beforeClosestRookBoxAxis !== null
      ? getRookOneDimensionalBoxSize(
          beforeRook.square,
          beforeBlackKing.square,
          beforeClosestRookBoxAxis,
        )
      : null
  const needsPhaseTwoWaitingMove = Boolean(
    beforeRook &&
      beforeWhiteKing &&
      beforeBlackKing &&
      beforeRookBoxAxis &&
      getMajorEndgamePhase(fen, 'r') === 2 &&
      isKnightMove(beforeWhiteKing.square, beforeBlackKing.square),
  )
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const whiteRook = findPiece(resultFen, 'w', 'r')
  const whiteKing = findPiece(resultFen, 'w', 'k')
  const blackKing = findPiece(resultFen, 'b', 'k')
  const rookIsSafe = !blackCanTakeWhiteMajorPiece(resultFen, 'r')
  const rookCutAxis =
    whiteRook && whiteKing && blackKing
      ? getRookCutAxis(whiteRook, whiteKing, blackKing)
      : null
  const rookBoxAxis = getRookEstablishedBoxAxis(resultFen)
  const closestRookBoxAxis =
    whiteRook && whiteKing && blackKing
      ? getClosestRookBoxAxis(whiteRook, whiteKing, blackKing)
      : null
  const closestRookBoxSize =
    whiteRook && blackKing && closestRookBoxAxis !== null
      ? getRookOneDimensionalBoxSize(
          whiteRook.square,
          blackKing.square,
          closestRookBoxAxis,
        )
      : null
  const rookPhaseTwoWaitingMove = Boolean(
    needsPhaseTwoWaitingMove &&
      move.piece === 'r' &&
      !chess.isCheck() &&
      beforeRook &&
      whiteRook &&
      beforeRookBoxAxis &&
      rookCutAxis === beforeRookBoxAxis &&
      squareCoordinates(whiteRook.square)[beforeRookBoxAxis] ===
        squareCoordinates(beforeRook.square)[beforeRookBoxAxis],
  )
  return {
    matePenalty: chess.isCheckmate() ? 0 : 1,
    rookCapturePenalty: rookIsSafe ? 0 : 1,
    stalematePenalty: !chess.isCheckmate() && chess.isStalemate() ? 1 : 0,
    rookBoxEstablishedPenalty:
      beforeRook &&
      beforeWhiteKing &&
      beforeBlackKing &&
      beforeClosestRookBoxAxis === null
        ? closestRookBoxAxis !== null
          ? 0
          : 1
        : 0,
    rookBoxAxisSwitchPenalty:
      beforeClosestRookBoxAxis === null &&
      beforeRookBoxAxis !== null &&
      closestRookBoxAxis !== null &&
      closestRookBoxAxis !== beforeRookBoxAxis
        ? 1
        : 0,
    rookBoxSize:
      beforeClosestRookBoxAxis === null &&
      closestRookBoxSize !== null
        ? closestRookBoxSize
        : 0,
    forcingCheckPenalty:
      chess.isCheck() &&
      !chess.isCheckmate() &&
      blackMustMoveAwayFromWhiteKing(resultFen)
        ? 0
        : 1,
    rookPhaseTwoWaitingPenalty: needsPhaseTwoWaitingMove
      ? rookPhaseTwoWaitingMove
        ? 0
        : 1
      : 0,
    rookPhaseTwoWaitingDistanceScore:
      needsPhaseTwoWaitingMove &&
      rookPhaseTwoWaitingMove &&
      whiteRook &&
      beforeBlackKing
        ? -kingDistance(whiteRook.square, beforeBlackKing.square)
        : 0,
    rookBoxPreservedPenalty:
      beforeClosestRookBoxSize !== null
        ? closestRookBoxSize === null ||
          closestRookBoxSize > beforeClosestRookBoxSize
          ? 1
          : 0
        : beforeRookBoxAxis !== null && rookBoxAxis === null
          ? 1
          : 0,
    rookPreservedBoxSize:
      beforeClosestRookBoxSize !== null && closestRookBoxSize !== null
        ? closestRookBoxSize
        : 0,
    rookBlackDistanceScore:
      move.piece === 'r' && whiteRook && blackKing
        ? -manhattanDistance(whiteRook.square, blackKing.square)
        : 1,
    kingRookLinePenalty:
      whiteKing && whiteRook && sharesRankOrFile(whiteKing.square, whiteRook.square)
        ? move.piece === 'k' &&
          beforeWhiteKing &&
          beforeBlackKing &&
          blackKing &&
          beforeRookBoxAxis !== null &&
          rookCutAxis === beforeRookBoxAxis &&
          kingDistance(whiteKing.square, blackKing.square) <
            kingDistance(beforeWhiteKing.square, beforeBlackKing.square)
          ? 0
          : 1
        : 0,
    kingDistance:
      whiteKing && blackKing
        ? manhattanDistance(whiteKing.square, blackKing.square)
        : 99,
  }
}

const ROOK_BOX_DISTANCE_RULE_DESCRIPTION = {
  id: 'maximize black distance',
  shortLabel: 'keep Black far from rook',
  helpText:
    "Move the rook as far as possible from Black's king while preserving the box.",
  guideOrder: 8,
} as const

export const rookWhiteRules: readonly OrderedRule<RookWhiteMoveScore>[] = [
  {
    id: 'mate',
    shortLabel: 'mate',
    helpText: '',
    compare: (first, second) => first.matePenalty - second.matePenalty,
  },
  {
    id: 'rook safe',
    shortLabel: 'pieces safe',
    helpText: '',
    compare: (first, second) =>
      first.rookCapturePenalty - second.rookCapturePenalty,
  },
  {
    id: 'no stalemate',
    shortLabel: 'no stalemate',
    helpText: '',
    compare: (first, second) =>
      first.stalematePenalty - second.stalematePenalty,
  },
  {
    id: 'establish box',
    shortLabel: 'establish box',
    helpText:
      "Put the rook on the row or file between the kings and closest to Black's king when not already.",
    compare: (first, second) =>
      first.rookBoxEstablishedPenalty - second.rookBoxEstablishedPenalty ||
      first.rookBoxSize - second.rookBoxSize ||
      first.rookBoxAxisSwitchPenalty - second.rookBoxAxisSwitchPenalty,
  },
  {
    id: 'forcing check',
    shortLabel: 'forcing check',
    helpText:
      "Check if it forces Black's king to walk away from White's king.",
    compare: (first, second) =>
      first.forcingCheckPenalty - second.forcingCheckPenalty,
  },
  {
    id: 'rook waiting move',
    shortLabel: 'rook waiting move',
    helpText:
      'When the kings are a knight move apart and the rook is on the row or file between them, make a rook waiting move as far as possible while staying between the kings.',
    compare: (first, second) =>
      first.rookPhaseTwoWaitingPenalty - second.rookPhaseTwoWaitingPenalty,
  },
  {
    id: 'rook waiting distance',
    shortLabel: 'rook waiting distance',
    helpText:
      "When a rook waiting move is required and the earlier priorities tie, place the rook as far as possible from Black's king.",
    compare: (first, second) =>
      first.rookPhaseTwoWaitingDistanceScore -
      second.rookPhaseTwoWaitingDistanceScore,
  },
  {
    ...ROOK_BOX_DISTANCE_RULE_DESCRIPTION,
    compare: (first, second) =>
      first.rookBoxPreservedPenalty - second.rookBoxPreservedPenalty ||
      first.rookPreservedBoxSize - second.rookPreservedBoxSize,
  },
  {
    id: 'king closer',
    shortLabel: 'White king closer',
    helpText:
      "Bring White's king closer to Black's king without entering the rook's lines.",
    guideOrder: 7,
    compare: (first, second) =>
      first.kingRookLinePenalty - second.kingRookLinePenalty ||
      first.kingDistance - second.kingDistance,
  },
  {
    ...ROOK_BOX_DISTANCE_RULE_DESCRIPTION,
    compare: (first, second) =>
      first.rookBlackDistanceScore - second.rookBlackDistanceScore,
  },
]

export function compareRookWhiteScores(
  first: RookWhiteMoveScore,
  second: RookWhiteMoveScore,
): number {
  return compareScoresByRules(first, second, rookWhiteRules)
}

export function getIdealRookWhiteMoves(fen: string): string[] {
  const chess = getChess(fen)
  const moves = chess.moves()
  if (chess.turn() !== 'w' || moves.length === 0) {
    return moves
  }
  return [...selectIdealMoves(
    moves.map((san) => ({ san, score: scoreRookWhiteMove(fen, san) })),
    rookWhiteRules,
  )]
}

export function scoreQueenBlackMove(
  fen: string,
  san: string,
): QueenBlackMoveScore {
  const chess = getChess(fen)
  const move = chess.move(san)
  const blackKing = findPiece(chess.fen(), 'b', 'k')
  return {
    captureQueenPenalty: move.captured === 'q' ? 0 : 1,
    centerDistance: blackKing ? kingWalkCenterDistance(blackKing.square) : 99,
  }
}

export function compareQueenBlackScores(
  first: QueenBlackMoveScore,
  second: QueenBlackMoveScore,
): number {
  return (
    first.captureQueenPenalty - second.captureQueenPenalty ||
    first.centerDistance - second.centerDistance
  )
}

export function getIdealQueenBlackMoves(
  fen: string,
  moves: readonly string[] = getChess(fen).moves(),
): string[] {
  return selectBestMoves(
    moves,
    (san) => scoreQueenBlackMove(fen, san),
    compareQueenBlackScores,
  )
}

export function scoreRookBlackMove(
  fen: string,
  san: string,
): RookBlackMoveScore {
  const startingBlackKing = findPiece(fen, 'b', 'k')
  const startingWhiteRook = findPiece(fen, 'w', 'r')
  const startingWhiteKing = findPiece(fen, 'w', 'k')
  const rookCutAxis =
    startingBlackKing && startingWhiteRook && startingWhiteKing
      ? getRookCutAxis(
          startingWhiteRook,
          startingWhiteKing,
          startingBlackKing,
        )
      : null
  const whiteKingRookDiagonalAdjacent =
    startingWhiteKing && startingWhiteRook
      ? isDiagonalKingMove(startingWhiteKing.square, startingWhiteRook.square)
      : false
  const startsWithOpposition =
    startingWhiteKing && startingBlackKing
      ? hasDirectKingOpposition(
          startingWhiteKing.square,
          startingBlackKing.square,
        )
      : false
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const whiteRook = findPiece(resultFen, 'w', 'r')
  const whiteKing = findPiece(resultFen, 'w', 'k')
  const blackKing = findPiece(resultFen, 'b', 'k')
  const rookDistance =
    whiteRook && blackKing
      ? manhattanDistance(blackKing.square, whiteRook.square)
      : 99
  const createsOpposition = Boolean(
    !whiteKingRookDiagonalAdjacent &&
      !startsWithOpposition &&
      whiteKing &&
      blackKing &&
      hasDirectKingOpposition(whiteKing.square, blackKing.square),
  )
  return {
    captureRookPenalty: move.captured === 'r' ? 0 : 1,
    cutLineDistance:
      rookCutAxis && whiteRook && blackKing
        ? getAxisDistance(blackKing.square, whiteRook.square, rookCutAxis)
        : 0,
    diagonalAdjacentRookDistance: whiteKingRookDiagonalAdjacent
      ? rookDistance
      : 0,
    rookOppositionPenalty: createsOpposition ? 1 : 0,
    rookDistance,
  }
}

export function compareRookBlackScores(
  first: RookBlackMoveScore,
  second: RookBlackMoveScore,
): number {
  return (
    first.captureRookPenalty - second.captureRookPenalty ||
    first.cutLineDistance - second.cutLineDistance ||
    first.diagonalAdjacentRookDistance -
      second.diagonalAdjacentRookDistance ||
    first.rookOppositionPenalty - second.rookOppositionPenalty ||
    first.rookDistance - second.rookDistance
  )
}

export function getIdealRookBlackMoves(
  fen: string,
  moves: readonly string[] = getChess(fen).moves(),
): string[] {
  return selectBestMoves(
    moves,
    (san) => scoreRookBlackMove(fen, san),
    compareRookBlackScores,
  )
}

export function getEndgameReturnToPositionMoves(
  fen: string,
  previousTurnFen: string | undefined,
  moves: readonly string[] = getChess(fen).moves(),
): string[] {
  if (!previousTurnFen) {
    return []
  }
  const previousPositionKey = positionKey(previousTurnFen)
  return moves.filter((san) => {
    const nextChess = getChess(fen)
    const move = nextChess.move(san)
    return move !== null && positionKey(nextChess.fen()) === previousPositionKey
  })
}

function getMajorBlackCandidates(
  fen: string,
  previousTurnFen: string | undefined,
  pieceType: 'q' | 'r',
): OpponentCandidates {
  const moves = getChess(fen).moves()
  if (moves.length === 0) {
    return { moves, idealMoves: [] }
  }
  const returnMoves = getEndgameReturnToPositionMoves(
    fen,
    previousTurnFen,
    moves,
  )
  if (returnMoves.length > 0) {
    return { moves, idealMoves: returnMoves }
  }
  return {
    moves,
    idealMoves:
      pieceType === 'q'
        ? getIdealQueenBlackMoves(fen, moves)
        : getIdealRookBlackMoves(fen, moves),
  }
}

function whiteLegalMoves(fen: string): readonly string[] {
  const chess = getChess(fen)
  return chess.turn() === 'w' ? chess.moves() : []
}

export const queenRuleSet: MateRuleSet<QueenWhiteMoveScore> = {
  id: 'queen',
  phase: (fen) => getMajorEndgamePhaseLabel(fen, 'q'),
  scoreWhite: scoreQueenWhiteMove,
  whiteRules: queenWhiteRules,
  whiteMoves: whiteLegalMoves,
  blackCandidates: (fen, previousTurnFen) =>
    getMajorBlackCandidates(fen, previousTurnFen, 'q'),
  help: queenHelp,
}

export const rookRuleSet: MateRuleSet<RookWhiteMoveScore> = {
  id: 'rook',
  phase: (fen) => getMajorEndgamePhaseLabel(fen, 'r'),
  scoreWhite: scoreRookWhiteMove,
  whiteRules: rookWhiteRules,
  whiteMoves: whiteLegalMoves,
  blackCandidates: (fen, previousTurnFen) =>
    getMajorBlackCandidates(fen, previousTurnFen, 'r'),
  help: rookHelp,
}

export {
  getMajorEndgamePhase,
  getQueenCageKingApproachDistance,
  getQueenCageKingApproachManhattanDistance,
  getQueenTwoSquareCage,
}
