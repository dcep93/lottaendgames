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
  readonly rookExactMateProgressPenalty: number
  readonly rookExactMateProgressRank: number
  readonly rookWaitingPenalty: number
  readonly rookWaitingEdgeDistanceScore: number | null
  readonly rookWaitingDistanceScore: number | null
  readonly rookBoxLossPenalty: number
  readonly rookBoxSize: number | null
  readonly rookBoxAxisRetentionPenalty: number
  readonly rookBoxRookApproachPenalty: number
  readonly forcingCheckPenalty: number
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

const queenHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: WHITE_INTRO,
  blackIntro: BLACK_INTRO,
  blackPriorities: [
    RETURN_POSITION_PRIORITY,
    "Take a piece if White isn't looking.",
    'Head toward the center, where Black has the most room to resist.',
  ],
  notes: [
    "Phase 2 means the Queen's rank or file is strictly between the two kings on that axis. It is shown only on White's turn.",
  ],
  noteBoards: [],
}

const rookHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: WHITE_INTRO,
  blackIntro: 'Black chooses the toughest reply.',
  blackPriorities: [
    'Repeat the position.',
    'Take a loose Rook.',
    'Move toward the nearest box wall.',
    "If the Rook is diagonally beside White's King, chase it.",
    'Avoid creating opposition.',
    'Move toward the Rook.',
  ],
  notes: [
    "Phase 2: the Rook cuts between the kings. Shown only on White's turn.",
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
    shortLabel: 'stable two-square corner cage',
    helpText:
      'Build or preserve a corner-plus-adjacent-edge cage from which every legal Black reply remains in those two squares.',
    compare: (first, second) => first.cagePenalty - second.cagePenalty,
  },
  {
    id: 'king to cage',
    shortLabel: 'white king toward cage support',
    helpText:
      "With a stable two-square corner cage, move White's king toward a mating-support square a knight's move from both the Queen and corner.",
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

function compareNullableAscending(
  first: number | null,
  second: number | null,
): number {
  if (first === null) return second === null ? 0 : 1
  if (second === null) return -1
  return first - second
}

export function scoreRookWhiteMove(
  fen: string,
  san: string,
): RookWhiteMoveScore {
  const beforeRook = findPiece(fen, 'w', 'r')
  const beforeWhiteKing = findPiece(fen, 'w', 'k')
  const beforeBlackKing = findPiece(fen, 'b', 'k')
  const beforeBox = getRookBoxFromFen(fen)
  const kingsAreKnightMoveApart = Boolean(
    beforeWhiteKing &&
      beforeBlackKing &&
      isKnightMove(beforeWhiteKing.square, beforeBlackKing.square),
  )
  const kingsHaveDirectOpposition = Boolean(
    beforeWhiteKing &&
      beforeBlackKing &&
      hasDirectKingOpposition(
        beforeWhiteKing.square,
        beforeBlackKing.square,
      ),
  )
  const rookWhiteKingDistance =
    beforeRook && beforeWhiteKing
      ? kingDistance(beforeRook.square, beforeWhiteKing.square)
      : null
  const rookIsAdjacentToWhiteKing = rookWhiteKingDistance === 1
  const kingMoveDistance =
    beforeWhiteKing && beforeBlackKing
      ? kingDistance(beforeWhiteKing.square, beforeBlackKing.square)
      : null
  const kingRowPlusFileDistance =
    beforeWhiteKing && beforeBlackKing
      ? manhattanDistance(beforeWhiteKing.square, beforeBlackKing.square)
      : null
  const needsEdgeFinishRookWaitingMove = Boolean(
    beforeBlackKing &&
      kingsHaveDirectOpposition &&
      rookIsAdjacentToWhiteKing &&
      edgeDistance(beforeBlackKing.square) === 0,
  )
  const needsProtectedRookWaitingMove =
    beforeBox.size !== null &&
    ((kingsHaveDirectOpposition && !rookIsAdjacentToWhiteKing) ||
      (kingsAreKnightMoveApart && rookIsAdjacentToWhiteKing) ||
      needsEdgeFinishRookWaitingMove)
  const needsDualCutDistantRookWaitingMove =
    beforeBox.size !== null &&
    rookIsAdjacentToWhiteKing &&
    kingMoveDistance === 3 &&
    kingRowPlusFileDistance === 5 &&
    beforeBox.strongestCuts.length === 2
  const needsOrthogonalDistantRookWaitingMove = Boolean(
    beforeBox.size !== null &&
      rookIsAdjacentToWhiteKing &&
      kingMoveDistance === 3 &&
      kingRowPlusFileDistance === 4 &&
      beforeRook &&
      beforeWhiteKing &&
      !isDiagonalKingMove(beforeRook.square, beforeWhiteKing.square) &&
      beforeBox.strongestCuts.some((cut) => !cut.closest),
  )
  const needsDistantRookWaitingMove =
    (beforeBox.size !== null &&
      kingsAreKnightMoveApart &&
      !rookIsAdjacentToWhiteKing) ||
    needsDualCutDistantRookWaitingMove ||
    needsOrthogonalDistantRookWaitingMove
  const needsRookWaitingMove =
    needsProtectedRookWaitingMove || needsDistantRookWaitingMove
  const blackEdgeDistance = beforeBlackKing
    ? edgeDistance(beforeBlackKing.square)
    : null
  const blackAlongEdgeCornerDistance =
    beforeBlackKing && blackEdgeDistance === 0
      ? (() => {
          const { file, rank } = squareCoordinates(beforeBlackKing.square)
          return Math.max(
            Math.min(file, 7 - file),
            Math.min(rank, 7 - rank),
          )
        })()
      : null
  const orthogonalAlignmentRunsInwardFromEdge = Boolean(
    beforeBlackKing &&
      beforeWhiteKing &&
      (() => {
        const black = squareCoordinates(beforeBlackKing.square)
        const white = squareCoordinates(beforeWhiteKing.square)
        const fileDistance = Math.abs(black.file - white.file)
        const rankDistance = Math.abs(black.rank - white.rank)
        return (
          ((black.rank === 0 || black.rank === 7) &&
            rankDistance > fileDistance) ||
          ((black.file === 0 || black.file === 7) &&
            fileDistance > rankDistance)
        )
      })(),
  )
  const keepsOrthogonalFarTempo =
    needsOrthogonalDistantRookWaitingMove &&
    blackAlongEdgeCornerDistance === 2 &&
    orthogonalAlignmentRunsInwardFromEdge
  const keepsDualCutFarTempo =
    needsDualCutDistantRookWaitingMove && blackEdgeDistance === 0
  const needsEdgeFinishBoundaryWaitingMove =
    needsEdgeFinishRookWaitingMove && blackAlongEdgeCornerDistance === 2
  const hasCloseKingFinishGeometry = Boolean(
    kingMoveDistance !== null &&
      rookWhiteKingDistance !== null &&
      kingMoveDistance <= 3 &&
      (kingMoveDistance <= 2 || rookWhiteKingDistance <= 3),
  )
  const usesExactBoxlessProgress = beforeBox.size === null
  const usesExactClosePiecesProgress =
    hasCloseKingFinishGeometry &&
    !keepsOrthogonalFarTempo &&
    !keepsDualCutFarTempo
  const usesExactMateProgress =
    !needsEdgeFinishBoundaryWaitingMove &&
    (usesExactClosePiecesProgress || usesExactBoxlessProgress)
  const beforeExactMateProgress = usesExactMateProgress
    ? lookupMajorPieceMateProgress('rook', fen)
    : null
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
  const retainsStrongestAxis = beforeBox.strongestCuts.some((beforeCut) =>
    resultBox.strongestCuts.some(
      (resultCut) => resultCut.axis === beforeCut.axis,
    ),
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
  const beforeRookBlackDistance =
    beforeRook && beforeBlackKing
      ? manhattanDistance(beforeRook.square, beforeBlackKing.square)
      : null
  const resultRookBlackDistance =
    whiteRook && blackKing
      ? manhattanDistance(whiteRook.square, blackKing.square)
      : null
  const resultExactMateProgress = usesExactMateProgress
    ? lookupMajorPieceMateProgress('rook', resultFen)
    : null
  const makesExactMateProgress = Boolean(
    beforeExactMateProgress?.kind === 'winning' &&
      resultExactMateProgress?.kind === 'winning' &&
      resultExactMateProgress.rank < beforeExactMateProgress.rank,
  )
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
      whiteRook &&
      ((!needsEdgeFinishBoundaryWaitingMove &&
        needsEdgeFinishRookWaitingMove) ||
        (preservesOrShrinksBox && retainsStrongestBoundary)) &&
      (!needsProtectedRookWaitingMove || rookEndsAdjacentToWhiteKing),
  )
  const losesOrEnlargesBox =
    resultBox.size === null ||
    (beforeBox.size !== null && resultBox.size > beforeBox.size)
  return {
    matePenalty: chess.isCheckmate() ? 0 : 1,
    rookCapturePenalty: rookIsSafe ? 0 : 1,
    stalematePenalty: !chess.isCheckmate() && chess.isStalemate() ? 1 : 0,
    rookExactMateProgressPenalty:
      usesExactMateProgress && !makesExactMateProgress ? 1 : 0,
    rookExactMateProgressRank:
      makesExactMateProgress && resultExactMateProgress?.kind === 'winning'
        ? resultExactMateProgress.rank
        : 0,
    rookWaitingPenalty: needsRookWaitingMove && !rookWaitingMove ? 1 : 0,
    rookWaitingEdgeDistanceScore:
      rookWaitingMove && needsProtectedRookWaitingMove && whiteRook
        ? -edgeDistance(whiteRook.square)
        : null,
    rookWaitingDistanceScore:
      rookWaitingMove && whiteRook && blackKing
        ? -manhattanDistance(whiteRook.square, blackKing.square)
        : null,
    rookBoxLossPenalty: losesOrEnlargesBox ? 1 : 0,
    rookBoxSize: resultBox.size,
    rookBoxAxisRetentionPenalty:
      beforeBox.size !== null &&
      resultBox.size === beforeBox.size &&
      !retainsStrongestAxis
        ? 1
        : 0,
    rookBoxRookApproachPenalty:
      beforeBox.size !== null &&
      resultBox.size === beforeBox.size &&
      move.piece === 'r' &&
      beforeRookBlackDistance !== null &&
      resultRookBlackDistance !== null &&
      resultRookBlackDistance < beforeRookBlackDistance
        ? 1
        : 0,
    forcingCheckPenalty:
      chess.isCheck() &&
      !chess.isCheckmate() &&
      blackMustMoveAwayFromWhiteKing(resultFen)
        ? 0
        : 1,
    kingDistance:
      whiteKing && blackKing
        ? kingDistance(whiteKing.square, blackKing.square)
        : null,
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
    id: 'exact mate progress',
    shortLabel: 'shortest mate',
    helpText: 'When active, follow the shortest forced mate.',
    compare: (first, second) =>
      first.rookExactMateProgressPenalty -
        second.rookExactMateProgressPenalty ||
      first.rookExactMateProgressRank - second.rookExactMateProgressRank,
  },
  {
    id: 'rook waiting move',
    shortLabel: 'waiting move',
    helpText:
      'When the kings are set, play a safe Rook waiting move that keeps the box.',
    compare: (first, second) =>
      first.rookWaitingPenalty - second.rookWaitingPenalty ||
      compareNullableAscending(
        first.rookWaitingEdgeDistanceScore,
        second.rookWaitingEdgeDistanceScore,
      ) ||
      compareNullableAscending(
        first.rookWaitingDistanceScore,
        second.rookWaitingDistanceScore,
      ),
  },
  {
    id: 'establish box',
    shortLabel: 'smaller box',
    helpText:
      "Make Black's box smaller. If it cannot shrink, keep the same wall and keep the Rook back.",
    compare: (first, second) =>
      first.rookBoxLossPenalty - second.rookBoxLossPenalty ||
      compareNullableAscending(first.rookBoxSize, second.rookBoxSize) ||
      first.rookBoxAxisRetentionPenalty -
        second.rookBoxAxisRetentionPenalty ||
      first.rookBoxRookApproachPenalty -
        second.rookBoxRookApproachPenalty,
  },
  {
    id: 'forcing check',
    shortLabel: 'push with check',
    helpText:
      'Check only when every reply pushes Black farther from your King.',
    compare: (first, second) =>
      first.forcingCheckPenalty - second.forcingCheckPenalty,
  },
  {
    id: 'king closer',
    shortLabel: 'king closer',
    helpText: 'Bring your King closer to Black.',
    applies: (score) =>
      score.kingDistance !== null && score.kingManhattanDistance !== null,
    compare: (first, second) =>
      first.kingDistance! - second.kingDistance! ||
      first.kingManhattanDistance! - second.kingManhattanDistance!,
  },
  {
    id: 'maximize black distance',
    shortLabel: 'rook farther',
    helpText: 'Keep your Rook farther from Black.',
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
