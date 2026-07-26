import type { Square } from 'chess.js'
import {
  findPiece,
  getChess,
  isKnightMove,
  kingDistance,
  manhattanDistance,
  squareCoordinates,
} from '../chess'
import {
  blackCanTakeWhiteMajorPiece,
  getRookBoxFromFen,
} from './majorPieceGeometry'
import { lookupMajorPieceMateProgress } from './majorPieceMateProgress'
import type { OrderedRule } from './types'

export type RookStrategyScore = {
  readonly matePenalty: number
  readonly rookCapturePenalty: number
  readonly stalematePenalty: number
  readonly convergencePenalty: number
  readonly keepBoxPenalty: number
  readonly waitingMovePenalty: number
  readonly waitingMoveBlackDistanceScore: number
  readonly shrinkBoxPenalty: number
  readonly shrinkBoxRoom: number
  readonly kingProximityPriority: number
  readonly kingDistance: number
  readonly kingManhattanDistance: number
  readonly rookHomePenalty: number
  readonly rookHomeBlackDistance: number
  readonly rookSafePenalty: number
  readonly rookSafeBlackDistanceScore: number
}

const ROOK_BOX_HELP = 'Create, keep and shrink a box around Black.'
const WAITING_MOVE_HELP =
  'Move the rook, keeping any existing box, as far from Black’s king as possible, but necessarily closer to White’s king than Black’s.'
const KING_CLOSER_HELP = "Bring White's king toward Black's king."

export const rookStrategyRules: readonly OrderedRule<RookStrategyScore>[] = [
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
    id: 'rook convergence',
    shortLabel: 'rook convergence',
    helpText: '',
    presentationRole: 'internal',
    compare: (first, second) =>
      first.convergencePenalty - second.convergencePenalty,
  },
  {
    id: 'rook box',
    shortLabel: 'rook box',
    helpText: ROOK_BOX_HELP,
    compare: (first, second) =>
      first.keepBoxPenalty - second.keepBoxPenalty,
  },
  {
    id: 'rook box',
    shortLabel: 'rook box',
    helpText: ROOK_BOX_HELP,
    compare: (first, second) =>
      first.shrinkBoxPenalty - second.shrinkBoxPenalty ||
      first.shrinkBoxRoom - second.shrinkBoxRoom,
  },
  {
    id: 'waiting move',
    shortLabel: 'waiting move',
    helpText: WAITING_MOVE_HELP,
    compare: (first, second) =>
      first.waitingMovePenalty - second.waitingMovePenalty ||
      first.waitingMoveBlackDistanceScore -
        second.waitingMoveBlackDistanceScore,
  },
  {
    id: 'rook box',
    shortLabel: 'rook box',
    helpText: ROOK_BOX_HELP,
    compare: (first, second) =>
      first.rookHomePenalty - second.rookHomePenalty ||
      first.rookHomeBlackDistance - second.rookHomeBlackDistance ||
      first.rookSafePenalty - second.rookSafePenalty ||
      first.rookSafeBlackDistanceScore -
        second.rookSafeBlackDistanceScore,
  },
  {
    id: 'king closer',
    shortLabel: 'king closer',
    helpText: KING_CLOSER_HELP,
    compare: (first, second) =>
      first.kingProximityPriority - second.kingProximityPriority ||
      first.kingDistance - second.kingDistance ||
      first.kingManhattanDistance - second.kingManhattanDistance,
  },
]

export function scoreRookStrategyMove(
  fen: string,
  san: string,
): RookStrategyScore {
  const beforeRook = findPiece(fen, 'w', 'r')
  const beforeWhiteKing = findPiece(fen, 'w', 'k')
  const beforeBlackKing = findPiece(fen, 'b', 'k')
  const beforeBox = getRookBoxFromFen(fen)
  const beforeBoxRoom = beforeBox.size
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const beforeProgress = lookupMajorPieceMateProgress('rook', fen)
  const resultProgress = lookupMajorPieceMateProgress('rook', resultFen)
  const whiteRook = findPiece(resultFen, 'w', 'r')
  const whiteKing = findPiece(resultFen, 'w', 'k')
  const blackKing = findPiece(resultFen, 'b', 'k')
  const resultBox = getRookBoxFromFen(resultFen)
  const resultBoxRoom = resultBox.size
  const rookIsSafe = !blackCanTakeWhiteMajorPiece(resultFen, 'r')
  const preservesOrShrinksBox =
    beforeBox.size !== null &&
    resultBox.size !== null &&
    resultBox.size <= beforeBox.size
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
  const needsKnightWaitingMove = Boolean(
    beforeWhiteKing &&
      beforeBlackKing &&
      isKnightMove(beforeWhiteKing.square, beforeBlackKing.square),
  )
  const needsWaitingMove = needsKnightWaitingMove
  const keepsExistingBox =
    beforeBox.size === null ||
    (preservesOrShrinksBox && retainsStrongestBoundary)
  const baseWaitingMove = Boolean(
    needsWaitingMove &&
      move.piece === 'r' &&
      move.captured === undefined &&
      !chess.isCheck() &&
      rookIsSafe &&
      keepsExistingBox &&
      beforeRook &&
      beforeBlackKing &&
      whiteRook &&
      whiteKing &&
      blackKing &&
      manhattanDistance(whiteRook.square, whiteKing.square) <
        manhattanDistance(whiteRook.square, blackKing.square) &&
      manhattanDistance(whiteRook.square, blackKing.square) >=
        manhattanDistance(beforeRook.square, beforeBlackKing.square),
  )
  const waitingMovePriority = !needsWaitingMove
    ? 0
    : baseWaitingMove
      ? 0
      : 1
  const waitingMoveBlackDistanceScore =
    baseWaitingMove && whiteRook && blackKing
      ? -manhattanDistance(whiteRook.square, blackKing.square)
      : 0
  const rookExposed = Boolean(
    whiteRook &&
      whiteKing &&
      blackKing &&
      kingDistance(whiteKing.square, whiteRook.square) >
        kingDistance(blackKing.square, whiteRook.square),
  )
  const kingGetsCloser = Boolean(
    move.piece === 'k' &&
      beforeWhiteKing &&
      beforeBlackKing &&
      whiteKing &&
      blackKing &&
      movesKingCloserWithoutAxisRegression(
        beforeWhiteKing.square,
        whiteKing.square,
        blackKing.square,
      ),
  )
  const rookHome = Boolean(
    beforeBox.size === null &&
      move.piece === 'r' &&
      beforeRook &&
      beforeWhiteKing &&
      beforeBlackKing &&
      whiteRook &&
      whiteKing &&
      blackKing &&
      isRookHomeMove(
        beforeWhiteKing.square,
        beforeRook.square,
        beforeBlackKing.square,
        whiteRook.square,
      ) &&
      (kingDistance(whiteRook.square, blackKing.square) > 1 ||
        kingDistance(whiteRook.square, whiteKing.square) === 1) &&
      !chess.isStalemate(),
  )
  const rookSafe = Boolean(
    beforeBox.size === null &&
      move.piece === 'r' &&
      beforeRook &&
      whiteRook &&
      whiteKing &&
      blackKing &&
      movedToDifferentEdge(beforeRook.square, whiteRook.square) &&
      kingDistance(whiteRook.square, blackKing.square) > 2 &&
      !chess.isStalemate(),
  )
  const shrinksBox = Boolean(
    move.piece === 'r' &&
      beforeBoxRoom !== null &&
      resultBoxRoom !== null &&
      resultBoxRoom < beforeBoxRoom &&
      !rookExposed &&
      !chess.isStalemate(),
  )
  const moveDoesNotRegressAfterReply = Boolean(
    beforeProgress.kind === 'winning' &&
      (shrinksBox || baseWaitingMove) &&
      chess.moves().every((blackSan) => {
        const afterBlack = getChess(resultFen)
        afterBlack.move(blackSan)
        const progress = lookupMajorPieceMateProgress(
          'rook',
          afterBlack.fen(),
        )
        return (
          progress.kind === 'winning' &&
          progress.rank <= beforeProgress.rank
        )
      }),
  )

  return {
    matePenalty: chess.isCheckmate() ? 0 : 1,
    rookCapturePenalty: rookIsSafe ? 0 : 1,
    stalematePenalty: !chess.isCheckmate() && chess.isStalemate() ? 1 : 0,
    convergencePenalty:
      beforeProgress.kind !== 'winning' ||
      (resultProgress.kind === 'winning' &&
        // Ordinary moves lower the proof rank. A human box shrink or
        // wait may spend a tempo, but no legal Black reply may give that
        // progress back.
        (resultProgress.rank < beforeProgress.rank ||
          (moveDoesNotRegressAfterReply &&
            (shrinksBox || baseWaitingMove))))
        ? 0
        : 1,
    keepBoxPenalty:
      beforeBox.size === null || preservesOrShrinksBox ? 0 : 1,
    waitingMovePenalty: waitingMovePriority,
    waitingMoveBlackDistanceScore,
    shrinkBoxPenalty: shrinksBox ? 0 : 1,
    shrinkBoxRoom:
      shrinksBox && resultBoxRoom !== null ? resultBoxRoom : 15,
    kingProximityPriority:
      move.piece !== 'k' ? 1 : kingGetsCloser ? 0 : 2,
    kingDistance:
      whiteKing && blackKing
        ? kingDistance(whiteKing.square, blackKing.square)
        : 8,
    kingManhattanDistance:
      whiteKing && blackKing
        ? manhattanDistance(whiteKing.square, blackKing.square)
        : 16,
    rookHomePenalty: rookHome ? 0 : 1,
    rookHomeBlackDistance:
      rookHome && whiteRook && blackKing
        ? manhattanDistance(whiteRook.square, blackKing.square)
        : 16,
    rookSafePenalty: rookSafe ? 0 : 1,
    rookSafeBlackDistanceScore:
      rookSafe && whiteRook && blackKing
        ? -kingDistance(whiteRook.square, blackKing.square)
        : 0,
  }
}

function movesKingCloserWithoutAxisRegression(
  beforeWhiteKingSquare: Square,
  resultWhiteKingSquare: Square,
  blackKingSquare: Square,
): boolean {
  const before = squareCoordinates(beforeWhiteKingSquare)
  const result = squareCoordinates(resultWhiteKingSquare)
  const black = squareCoordinates(blackKingSquare)
  const beforeFileDistance = Math.abs(before.file - black.file)
  const beforeRankDistance = Math.abs(before.rank - black.rank)
  const resultFileDistance = Math.abs(result.file - black.file)
  const resultRankDistance = Math.abs(result.rank - black.rank)

  return (
    resultFileDistance <= beforeFileDistance &&
    resultRankDistance <= beforeRankDistance &&
    (resultFileDistance < beforeFileDistance ||
      resultRankDistance < beforeRankDistance)
  )
}

function isRookHomeMove(
  whiteKingSquare: Square,
  beforeRookSquare: Square,
  blackKingSquare: Square,
  resultRookSquare: Square,
): boolean {
  const white = squareCoordinates(whiteKingSquare)
  const beforeRook = squareCoordinates(beforeRookSquare)
  const black = squareCoordinates(blackKingSquare)
  const resultRook = squareCoordinates(resultRookSquare)
  return (
    (black.file < white.file &&
      beforeRook.file !== white.file - 1 &&
      resultRook.file === white.file - 1) ||
    (black.file > white.file &&
      beforeRook.file !== white.file + 1 &&
      resultRook.file === white.file + 1) ||
    (black.rank < white.rank &&
      beforeRook.rank !== white.rank - 1 &&
      resultRook.rank === white.rank - 1) ||
    (black.rank > white.rank &&
      beforeRook.rank !== white.rank + 1 &&
      resultRook.rank === white.rank + 1) ||
    (beforeRook.file === white.file &&
      white.file === black.file &&
      Math.abs(resultRook.file - white.file) === 1) ||
    (beforeRook.rank === white.rank &&
      white.rank === black.rank &&
      Math.abs(resultRook.rank - white.rank) === 1)
  )
}

function movedToDifferentEdge(
  beforeSquare: Square,
  resultSquare: Square,
): boolean {
  const beforeEdges = squareEdges(beforeSquare)
  const resultEdges = squareEdges(resultSquare)
  return (
    resultEdges.length > 0 &&
    (beforeEdges.length === 0 ||
      resultEdges.some((edge) => !beforeEdges.includes(edge)))
  )
}

function squareEdges(square: Square): readonly string[] {
  const { file, rank } = squareCoordinates(square)
  return [
    ...(file === 0 ? ['left'] : []),
    ...(file === 7 ? ['right'] : []),
    ...(rank === 0 ? ['bottom'] : []),
    ...(rank === 7 ? ['top'] : []),
  ]
}
