import type { Square } from 'chess.js'
import {
  edgeDistance,
  findPiece,
  getChess,
  hasDirectKingOpposition,
  isKnightMove,
  kingDistance,
  manhattanDistance,
  squareCoordinates,
} from '../chess'
import {
  blackCanTakeWhiteMajorPiece,
  getRookBoxFromFen,
} from './majorPieceGeometry'
import type { OrderedRule } from './types'

export type RookStrategyScore = {
  readonly matePenalty: number
  readonly rookCapturePenalty: number
  readonly stalematePenalty: number
  readonly keepBoxPenalty: number
  readonly waitingMovePenalty: number
  readonly waitingMoveCenterScore: number
  readonly edgeNetPenalty: number
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

const COVER_ESCAPE_SQUARES_HELP =
  "Cover the squares beside Black's king so the rook can mate."
const KEEP_BOX_HELP = 'Keep Black inside its current box.'
const WAITING_MOVE_HELP =
  "Whenever the kings are a knight's move apart, keep the box and move the rook to the board edge on White's side. This applies wherever Black is. If White's king blocks that edge and Black happens to be on an edge, use the other edge. When the kings face each other, keep the box and move the rook diagonally beside White's king, toward the center."
const SHRINK_BOX_HELP =
  'Move the rook wall closer to leave Black less room.'
const KING_PROXIMITY_HELP = "Bring White's king towards Black's."
const ROOK_BOX_SIZE_HELP = "Use the rook to make a box around Black's king."

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
    id: 'keep box',
    shortLabel: 'keep the box',
    helpText: KEEP_BOX_HELP,
    compare: (first, second) =>
      first.keepBoxPenalty - second.keepBoxPenalty,
  },
  {
    id: 'waiting move',
    shortLabel: 'waiting move',
    helpText: WAITING_MOVE_HELP,
    compare: (first, second) =>
      first.waitingMovePenalty - second.waitingMovePenalty ||
      first.waitingMoveCenterScore - second.waitingMoveCenterScore,
  },
  {
    id: 'cover escape squares',
    shortLabel: 'cover escape squares',
    helpText: COVER_ESCAPE_SQUARES_HELP,
    compare: (first, second) =>
      first.edgeNetPenalty - second.edgeNetPenalty,
  },
  {
    id: 'shrink box',
    shortLabel: 'shrink the box',
    helpText: SHRINK_BOX_HELP,
    compare: (first, second) =>
      first.shrinkBoxPenalty - second.shrinkBoxPenalty ||
      first.shrinkBoxRoom - second.shrinkBoxRoom,
  },
  {
    id: 'rook box size',
    shortLabel: 'rook box size',
    helpText: ROOK_BOX_SIZE_HELP,
    compare: (first, second) =>
      first.rookHomePenalty - second.rookHomePenalty ||
      first.rookHomeBlackDistance - second.rookHomeBlackDistance ||
      first.rookSafePenalty - second.rookSafePenalty ||
      first.rookSafeBlackDistanceScore -
        second.rookSafeBlackDistanceScore,
  },
  {
    id: 'king proximity',
    shortLabel: 'king proximity',
    helpText: KING_PROXIMITY_HELP,
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
    beforeBox.size !== null &&
      beforeWhiteKing &&
      beforeBlackKing &&
      isKnightMove(beforeWhiteKing.square, beforeBlackKing.square),
  )
  const needsOppositionWaitingMove = Boolean(
    beforeBox.size !== null &&
      beforeWhiteKing &&
      beforeBlackKing &&
      hasDirectKingOpposition(
        beforeWhiteKing.square,
        beforeBlackKing.square,
      ),
  )
  const needsWaitingMove =
    needsKnightWaitingMove || needsOppositionWaitingMove
  const baseWaitingMove = Boolean(
    needsWaitingMove &&
      move.piece === 'r' &&
      move.captured === undefined &&
      !chess.isCheck() &&
      rookIsSafe &&
      preservesOrShrinksBox &&
      retainsStrongestBoundary &&
      beforeRook &&
      whiteRook &&
      whiteKing &&
      blackKing,
  )
  const edgeWaitingMove = Boolean(
    baseWaitingMove &&
      beforeRook &&
      whiteRook &&
      rookMovesToEdge(beforeRook.square, whiteRook.square),
  )
  const oppositionWaitingMove = Boolean(
    baseWaitingMove &&
      whiteRook &&
      whiteKing &&
      squaresAreDiagonallyAdjacent(
        whiteRook.square,
        whiteKing.square,
      ),
  )
  const waitingMovePriority = !needsWaitingMove
    ? 0
    : needsOppositionWaitingMove
      ? oppositionWaitingMove
        ? 0
        : 1
      : edgeWaitingMove &&
        beforeRook &&
        whiteRook &&
        whiteKing &&
        blackKing &&
        rookWaitsAtEdgeOnWhiteSide(
          beforeRook.square,
          whiteRook.square,
          whiteKing.square,
          blackKing.square,
        )
      ? 0
      : edgeWaitingMove &&
          beforeRook &&
          beforeWhiteKing &&
          beforeBlackKing &&
          kingDistance(beforeRook.square, beforeWhiteKing.square) === 1 &&
          isEdgeSquare(beforeBlackKing.square)
        ? 1
        : 2
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
  const setsEdgeNet =
    beforeBlackKing &&
    isEdgeSquare(beforeBlackKing.square) &&
    !chess.isCheckmate() &&
    chess.moves().length > 0 &&
    chess.moves().every((blackSan) => {
      const afterBlack = getChess(resultFen)
      afterBlack.move(blackSan)
      return afterBlack.moves().some((whiteSan) => {
        const afterWhite = getChess(afterBlack.fen())
        afterWhite.move(whiteSan)
        return afterWhite.isCheckmate()
      })
    })
  const shrinksBox = Boolean(
    move.piece === 'r' &&
      beforeBoxRoom !== null &&
      resultBoxRoom !== null &&
      resultBoxRoom < beforeBoxRoom &&
      !rookExposed &&
      !chess.isStalemate(),
  )

  return {
    matePenalty: chess.isCheckmate() ? 0 : 1,
    rookCapturePenalty: rookIsSafe ? 0 : 1,
    stalematePenalty: !chess.isCheckmate() && chess.isStalemate() ? 1 : 0,
    keepBoxPenalty:
      beforeBox.size === null || preservesOrShrinksBox ? 0 : 1,
    waitingMovePenalty: waitingMovePriority,
    waitingMoveCenterScore:
      needsOppositionWaitingMove &&
      oppositionWaitingMove &&
      whiteRook
        ? -edgeDistance(whiteRook.square)
        : 0,
    edgeNetPenalty: setsEdgeNet ? 0 : 1,
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

function squaresAreDiagonallyAdjacent(
  firstSquare: Square,
  secondSquare: Square,
): boolean {
  const first = squareCoordinates(firstSquare)
  const second = squareCoordinates(secondSquare)
  return (
    Math.abs(first.file - second.file) === 1 &&
    Math.abs(first.rank - second.rank) === 1
  )
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

function rookWaitsAtEdgeOnWhiteSide(
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
  const resultCoordinate = resultRook[movementAxis]

  return (
    rookMovesToEdge(beforeRookSquare, resultRookSquare) &&
    Math.sign(resultCoordinate - blackKing[movementAxis]) ===
      Math.sign(whiteKing[movementAxis] - blackKing[movementAxis])
  )
}

function rookMovesToEdge(
  beforeRookSquare: Square,
  resultRookSquare: Square,
): boolean {
  const beforeRook = squareCoordinates(beforeRookSquare)
  const resultRook = squareCoordinates(resultRookSquare)
  const movementAxis =
    beforeRook.file === resultRook.file ? 'rank' : 'file'
  return resultRook[movementAxis] === 0 || resultRook[movementAxis] === 7
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

function isEdgeSquare(square: Square): boolean {
  const { file, rank } = squareCoordinates(square)
  return file === 0 || file === 7 || rank === 0 || rank === 7
}
