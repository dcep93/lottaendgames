import type { Square } from 'chess.js'
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
  positionKey,
  squareCoordinates,
} from '../chess'
import {
  blackCanTakeWhiteMajorPiece,
  blackMustMoveAwayFromWhiteKing,
  getAxisDistance,
  getMajorEndgamePhase,
  getMajorEndgamePhaseLabel,
  getQueenBoxDimensions,
  getQueenCageKingApproachDistance,
  getQueenCageKingApproachManhattanDistance,
  getQueenMoveDistance,
  getQueenTwoSquareCage,
  getRookBox,
  getRookBoxFromFen,
  isQueenRankOrFileChannelBetween,
} from './majorPieceGeometry'
import { lookupMajorPieceMateProgress } from './majorPieceMateProgress'
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
  readonly queenBoxShorterSide: number
  readonly queenBoxLongerSide: number
  readonly cageKingApproachPriority: 0 | 1 | 2
  readonly cageKingApproachDistance: number | null
  readonly cageKingApproachManhattanDistance: number | null
  readonly whiteKingBetweenPiecesPenalty: number
  readonly kingDistance: number | null
  readonly kingManhattanDistance: number | null
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
  readonly proofProgressPenalty: number
  readonly rookWaitingPenalty: number
  readonly rookEstablishBoxPenalty: number
  readonly rookPhaseTwoBoxSize: number | null
  readonly rookFinishBoxSize: number | null
  readonly forcingCheckPenalty: number
  readonly kingApproachPriority: 0 | 1 | 2
  readonly kingDistance: number | null
  readonly kingManhattanDistance: number | null
  readonly rookBlackDistanceScore: number | null
}

export type RookBlackMoveScore = {
  readonly captureRookPenalty: number
  readonly cutLineDistance: number
  readonly diagonalAdjacentRookDistance: number
  readonly rookOppositionPenalty: number
  readonly rookDistance: number
}

const WHITE_INTRO =
  "White's best moves are the moves that survive these priorities in order. Moves tied at one priority remain candidates for the next priority."

const BLACK_INTRO =
  'Black uses its own priorities to put up the strongest resistance. Black is not trying to help the mate; it looks for the most stubborn legal reply.'

const RETURN_POSITION_PRIORITY =
  'Return to the previous board position when a legal reply can recreate it.'
const CAPTURE_LOOSE_PIECE_PRIORITY = "Take a piece if White isn't looking."

const queenHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: WHITE_INTRO,
  blackIntro: BLACK_INTRO,
  blackPriorities: [
    RETURN_POSITION_PRIORITY,
    CAPTURE_LOOSE_PIECE_PRIORITY,
    'Head toward the center, where Black has the most room to resist.',
  ],
  notes: [
    "Phase 2 means the Queen's rank or file is strictly between the two kings on that axis.",
  ],
  noteBoards: [],
}

const rookHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: WHITE_INTRO,
  blackIntro: BLACK_INTRO,
  blackPriorities: [
    RETURN_POSITION_PRIORITY,
    CAPTURE_LOOSE_PIECE_PRIORITY,
    'Move toward the nearest box wall.',
    "If the Rook is diagonally beside White's king, chase it.",
    'Avoid giving White opposition.',
    'Move toward the Rook.',
  ],
  notes: [
    "Phase 2 means the Rook's rank or file is strictly between the two kings on that axis.",
  ],
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

function compareOptionalDistances(
  first: number | null,
  second: number | null,
): number {
  return first === null || second === null ? 0 : first - second
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
  const queenBox =
    whiteQueen && blackKing
      ? getQueenBoxDimensions(whiteQueen.square, blackKing.square)
      : null
  const cageKingApproachDistance =
    shouldWalkCageKing && resultCage && move.piece === 'k' && whiteKing && whiteQueen
      ? getQueenCageKingApproachDistance(
          whiteKing.square,
          whiteQueen.square,
          startingCage.corner,
        )
      : null
  const cageKingApproachManhattanDistance =
    cageKingApproachDistance !== null && whiteKing && whiteQueen
      ? getQueenCageKingApproachManhattanDistance(
          whiteKing.square,
          whiteQueen.square,
          startingCage!.corner,
        )
      : null
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
    queenBoxShorterSide: queenBox?.shorterSide ?? 99,
    queenBoxLongerSide: queenBox?.longerSide ?? 99,
    cageKingApproachPriority:
      shouldWalkCageKing && resultCage
        ? move.piece !== 'k'
          ? 1
          : cageKingApproachDistance === null
            ? 2
            : 0
        : 0,
    cageKingApproachDistance,
    cageKingApproachManhattanDistance,
    whiteKingBetweenPiecesPenalty:
      move.piece === 'k' &&
      whiteQueen &&
      whiteKing &&
      blackKing &&
      isQueenRankOrFileChannelBetween(whiteKing, whiteQueen, blackKing)
        ? 1
        : 0,
    kingDistance:
      whiteKing && blackKing
        ? kingDistance(whiteKing.square, blackKing.square)
        : null,
    kingManhattanDistance:
      whiteKing && blackKing
        ? manhattanDistance(whiteKing.square, blackKing.square)
        : null,
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
    shortLabel: 'two-square corner cage',
    helpText:
      'Build or preserve a corner-plus-adjacent-edge cage from which every legal Black reply remains in those two squares.',
    compare: (first, second) => first.cagePenalty - second.cagePenalty,
  },
  {
    id: 'king to cage',
    shortLabel: 'white king toward cage support',
    helpText:
      "With a two-square corner cage, move White's king toward a mating-support square a knight's move from both the Queen and corner.",
    compare: (first, second) =>
      first.cageKingApproachPriority - second.cageKingApproachPriority ||
      compareOptionalDistances(
        first.cageKingApproachDistance,
        second.cageKingApproachDistance,
      ) ||
      compareOptionalDistances(
        first.cageKingApproachManhattanDistance,
        second.cageKingApproachManhattanDistance,
      ),
  },
  {
    id: 'white pieces off edge',
    shortLabel: 'white pieces off edge',
    helpText: 'Minimize the number of White pieces on edge squares.',
    compare: (first, second) =>
      first.whitePieceEdgePenalty - second.whitePieceEdgePenalty,
  },
  {
    id: 'queen knight move',
    shortLabel: 'queen a knight move from black',
    helpText: "Keep or place the Queen a knight's move from Black's king.",
    compare: (first, second) =>
      first.queenKnightMovePenalty - second.queenKnightMovePenalty,
  },
  {
    id: 'queen box size',
    shortLabel: 'queen box size',
    helpText:
      "Minimize the shorter side of the board-edge rectangle bounded by the Queen's rank and file containing Black's king, then minimize its longer side.",
    compare: (first, second) =>
      first.queenBoxShorterSide - second.queenBoxShorterSide ||
      first.queenBoxLongerSide - second.queenBoxLongerSide,
  },
  {
    id: 'king closer',
    shortLabel: 'white king closer',
    helpText:
      "Minimize the resulting king-move distance to Black without entering the Queen's rank/file channel between the Queen and Black's king.",
    applies: (score) =>
      score.kingDistance !== null && score.kingManhattanDistance !== null,
    compare: (first, second) =>
      first.whiteKingBetweenPiecesPenalty -
        second.whiteKingBetweenPiecesPenalty ||
      first.kingDistance! - second.kingDistance! ||
      first.kingManhattanDistance! - second.kingManhattanDistance!,
  },
  {
    id: 'shorter queen move',
    shortLabel: 'shorter queen move',
    helpText:
      'Among otherwise tied Queen moves, prefer fewer squares traversed.',
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
  const beforeMateProgress = lookupMajorPieceMateProgress('rook', fen)
  const beforeRook = findPiece(fen, 'w', 'r')
  const beforeWhiteKing = findPiece(fen, 'w', 'k')
  const beforeBlackKing = findPiece(fen, 'b', 'k')
  const beforeBox = getRookBoxFromFen(fen)
  const beforeIsPhaseTwo = getMajorEndgamePhase(fen, 'r') === 2
  const blackEdgeDistance = beforeBlackKing
    ? edgeDistance(beforeBlackKing.square)
    : null
  const needsRookWaitingMove = Boolean(
    beforeBox.size !== null &&
      beforeWhiteKing &&
      beforeBlackKing &&
      isKnightMove(beforeWhiteKing.square, beforeBlackKing.square),
  )
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const whiteRook = findPiece(resultFen, 'w', 'r')
  const whiteKing = findPiece(resultFen, 'w', 'k')
  const blackKing = findPiece(resultFen, 'b', 'k')
  const rookIsSafe = !blackCanTakeWhiteMajorPiece(resultFen, 'r')
  const resultBox = getRookBoxFromFen(resultFen)
  const preservesOrShrinksBox = Boolean(
    beforeBox.size !== null &&
      resultBox.size !== null &&
      resultBox.size <= beforeBox.size,
  )
  const retainsStrongestBoundary = Boolean(
    beforeRook &&
      whiteRook &&
      beforeBox.strongestCuts.some((beforeCut) =>
        resultBox.cuts.some(
          (resultCut) =>
            resultCut.axis === beforeCut.axis &&
            squareCoordinates(whiteRook.square)[resultCut.axis] ===
              squareCoordinates(beforeRook.square)[beforeCut.axis],
        ),
      ),
  )
  const resultRookBlackDistance =
    whiteRook && blackKing
      ? manhattanDistance(whiteRook.square, blackKing.square)
      : null
  const rookEndsAdjacentToWhiteKing = Boolean(
    whiteRook &&
      whiteKing &&
      kingDistance(whiteRook.square, whiteKing.square) === 1,
  )
  const rookWaitingMove = Boolean(
    needsRookWaitingMove &&
      move.piece === 'r' &&
      move.captured === undefined &&
      !chess.isCheck() &&
      rookIsSafe &&
      beforeRook &&
      whiteRook &&
      whiteKing &&
      blackKing &&
      !rookEndsAdjacentToWhiteKing &&
      preservesOrShrinksBox &&
      retainsStrongestBoundary
  )
  const preferredRookWaitingMove = Boolean(
    rookWaitingMove &&
      beforeRook &&
      whiteRook &&
      whiteKing &&
      blackKing &&
      waitingWhiteKingBetweenOtherPieces(
        beforeRook.square,
        whiteRook.square,
        whiteKing.square,
        blackKing.square,
      ),
  )
  const resultMateProgress = lookupMajorPieceMateProgress('rook', resultFen)
  const establishesPhaseTwoBox = Boolean(
    getMajorEndgamePhase(resultFen, 'r') === 2 &&
      (!beforeIsPhaseTwo || preservesOrShrinksBox),
  )
  const beforeKingFileDistance =
    beforeWhiteKing && beforeBlackKing
      ? getAxisDistance(
          beforeWhiteKing.square,
          beforeBlackKing.square,
          'file',
        )
      : null
  const beforeKingRankDistance =
    beforeWhiteKing && beforeBlackKing
      ? getAxisDistance(
          beforeWhiteKing.square,
          beforeBlackKing.square,
          'rank',
        )
      : null
  const resultKingFileDistance =
    whiteKing && blackKing
      ? getAxisDistance(whiteKing.square, blackKing.square, 'file')
      : null
  const resultKingRankDistance =
    whiteKing && blackKing
      ? getAxisDistance(whiteKing.square, blackKing.square, 'rank')
      : null
  const resultKingDistance =
    whiteKing && blackKing
      ? kingDistance(whiteKing.square, blackKing.square)
      : null
  const kingMoveRegressesAxis = Boolean(
    beforeKingFileDistance !== null &&
      beforeKingRankDistance !== null &&
      resultKingFileDistance !== null &&
      resultKingRankDistance !== null &&
      (resultKingFileDistance > beforeKingFileDistance ||
        resultKingRankDistance > beforeKingRankDistance),
  )
  const kingMoveImprovesAxis = Boolean(
    beforeKingFileDistance !== null &&
      beforeKingRankDistance !== null &&
      resultKingFileDistance !== null &&
      resultKingRankDistance !== null &&
      (resultKingFileDistance < beforeKingFileDistance ||
        resultKingRankDistance < beforeKingRankDistance),
  )
  const kingApproachPriority: 0 | 1 | 2 =
    move.piece !== 'k'
      ? 1
      : kingMoveImprovesAxis && !kingMoveRegressesAxis
        ? 0
        : 2
  const forcingCheck =
    chess.isCheck() &&
    !chess.isCheckmate() &&
    blackMustMoveAwayFromWhiteKing(resultFen)
  const makesMateProgress =
    beforeMateProgress.kind === 'winning' &&
    resultMateProgress.kind === 'winning' &&
    resultMateProgress.rank < beforeMateProgress.rank
  return {
    matePenalty: chess.isCheckmate() ? 0 : 1,
    rookCapturePenalty: rookIsSafe ? 0 : 1,
    stalematePenalty: !chess.isCheckmate() && chess.isStalemate() ? 1 : 0,
    proofProgressPenalty: makesMateProgress ? 0 : 1,
    rookWaitingPenalty: !needsRookWaitingMove
      ? 0
      : preferredRookWaitingMove
        ? 0
        : rookWaitingMove
          ? 1
          : 2,
    rookEstablishBoxPenalty: establishesPhaseTwoBox ? 0 : 1,
    rookPhaseTwoBoxSize: establishesPhaseTwoBox ? resultBox.size : null,
    rookFinishBoxSize:
      blackEdgeDistance === 0 && establishesPhaseTwoBox
        ? resultBox.size
        : null,
    forcingCheckPenalty: forcingCheck ? 0 : 1,
    kingApproachPriority,
    kingDistance: resultKingDistance,
    kingManhattanDistance:
      whiteKing && blackKing
        ? manhattanDistance(whiteKing.square, blackKing.square)
        : null,
    rookBlackDistanceScore:
      resultRookBlackDistance === null ? null : -resultRookBlackDistance,
  }
}

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
    id: 'finish guarantee',
    shortLabel: 'finish guarantee',
    helpText:
      'The app filters out moves that could loop or draw by the fifty-move rule. You do not need to calculate this.',
    presentationRole: 'guard',
    compare: (first, second) =>
      first.proofProgressPenalty - second.proofProgressPenalty,
  },
  {
    id: 'forcing check',
    shortLabel: 'push with check',
    helpText:
      "Check when every reply pushes Black farther from White's king.",
    compare: (first, second) =>
      first.forcingCheckPenalty - second.forcingCheckPenalty,
  },
  {
    id: 'establish box',
    shortLabel: 'establish box',
    helpText:
      'Use the Rook to make a phase 2 box. When Black is on the edge, shrink it.',
    compare: (first, second) =>
      first.rookEstablishBoxPenalty - second.rookEstablishBoxPenalty ||
      compareOptionalDistances(
        first.rookFinishBoxSize,
        second.rookFinishBoxSize,
      ),
  },
  {
    id: 'rook waiting move',
    shortLabel: 'waiting move',
    helpText:
      "When the kings are a knight's move apart, keep the box with a Rook move. Prefer White's king between Black's king and the Rook, without placing the Rook beside White's king.",
    compare: (first, second) =>
      first.rookWaitingPenalty - second.rookWaitingPenalty,
  },
  {
    id: 'king closer',
    shortLabel: 'king closer',
    helpText: "Move White's king closer to Black's king.",
    applies: (score) =>
      score.kingDistance !== null && score.kingManhattanDistance !== null,
    compare: (first, second) =>
      first.kingApproachPriority - second.kingApproachPriority ||
      first.kingDistance! - second.kingDistance! ||
      first.kingManhattanDistance! - second.kingManhattanDistance!,
  },
  {
    id: 'maximize black distance',
    shortLabel: 'rook farther',
    helpText: "Keep the Rook farther from Black's king.",
    applies: (score) => score.rookBlackDistanceScore !== null,
    compare: (first, second) =>
      first.rookBlackDistanceScore! - second.rookBlackDistanceScore!,
  },
]

export function compareRookWhiteScores(
  first: RookWhiteMoveScore,
  second: RookWhiteMoveScore,
): number {
  return compareScoresByRules(first, second, rookWhiteRules)
}

function waitingWhiteKingBetweenOtherPieces(
  beforeRookSquare: Square,
  resultRookSquare: Square,
  whiteKingSquare: Square,
  blackKingSquare: Square,
): boolean {
  const beforeRook = squareCoordinates(beforeRookSquare)
  const resultRook = squareCoordinates(resultRookSquare)
  const whiteKing = squareCoordinates(whiteKingSquare)
  const blackKing = squareCoordinates(blackKingSquare)
  const movementAxis =
    beforeRook.file === resultRook.file ? 'rank' : 'file'
  const lower = Math.min(
    resultRook[movementAxis],
    blackKing[movementAxis],
  )
  const upper = Math.max(
    resultRook[movementAxis],
    blackKing[movementAxis],
  )
  return lower < whiteKing[movementAxis] && whiteKing[movementAxis] < upper
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
  const startingRookBox =
    startingBlackKing && startingWhiteRook && startingWhiteKing
      ? getRookBox(
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
      startingRookBox &&
      startingRookBox.strongestCuts.length > 0 &&
      startingWhiteRook &&
      blackKing
        ? Math.min(
            ...startingRookBox.strongestCuts.map((cut) =>
              getAxisDistance(
                blackKing.square,
                startingWhiteRook.square,
                cut.axis,
              ),
            ),
          )
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
