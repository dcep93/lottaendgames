import type { Square } from 'chess.js'
import {
  findPiece,
  getChess,
  isDiagonalKingMove,
  kingDistance,
  manhattanDistance,
  squareCoordinates,
  squareFromCoordinates,
} from '../chess'
import { blackCanTakeWhiteMajorPiece, getRookBoxFromFen } from './majorPieceGeometry'
import type { OrderedRule } from './types'

export type RookStrategyScore = {
  readonly matePenalty: number
  readonly rookCapturePenalty: number
  readonly stalematePenalty: number
  readonly mateNextPenalty: number
  readonly squeezePenalty: number
  readonly squeezeRoom: number
  readonly approachPenalty: number
  readonly approachDiagonalPenalty: number
  readonly approachRookDistance: number
  readonly keepRoomPenalty: number
  readonly keepRoomDiagonalPenalty: number
  readonly keepRoomCriticalDistance: number
  readonly keepRoomRookDistance: number
  readonly rookHomePenalty: number
  readonly rookHomeBlackDistance: number
  readonly rookSafePenalty: number
  readonly rookSafeBlackDistanceScore: number
}

const FINISH_HELP =
  "Checkmate now, or make the final setup when every Black reply allows checkmate."
const SHRINK_BOX_HELP =
  'Use the rook to leave Black as little room as possible.'
const FORCE_OPPOSITION_HELP =
  "Bring White's king into opposition. When a waiting move is needed, keep the box and make Black move."
const BOX_BLACK_IN_HELP =
  "Put the rook between the kings. If Black is too close, bring the rook beside White's king or move it to a safe edge first."

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
    id: 'finish',
    shortLabel: 'finish',
    helpText: FINISH_HELP,
    compare: (first, second) =>
      first.mateNextPenalty - second.mateNextPenalty,
  },
  {
    id: 'shrink box',
    shortLabel: 'shrink the box',
    helpText: SHRINK_BOX_HELP,
    compare: (first, second) =>
      first.squeezePenalty - second.squeezePenalty ||
      first.squeezeRoom - second.squeezeRoom,
  },
  {
    id: 'force opposition',
    shortLabel: 'force opposition',
    helpText: FORCE_OPPOSITION_HELP,
    compare: (first, second) =>
      first.approachPenalty - second.approachPenalty ||
      first.approachDiagonalPenalty -
        second.approachDiagonalPenalty ||
      first.approachRookDistance - second.approachRookDistance ||
      first.keepRoomPenalty - second.keepRoomPenalty ||
      first.keepRoomDiagonalPenalty -
        second.keepRoomDiagonalPenalty ||
      first.keepRoomCriticalDistance -
        second.keepRoomCriticalDistance ||
      first.keepRoomRookDistance - second.keepRoomRookDistance,
  },
  {
    id: 'box black in',
    shortLabel: 'box black in',
    helpText: BOX_BLACK_IN_HELP,
    compare: (first, second) =>
      first.rookHomePenalty - second.rookHomePenalty ||
      first.rookHomeBlackDistance - second.rookHomeBlackDistance ||
      first.rookSafePenalty - second.rookSafePenalty ||
      first.rookSafeBlackDistanceScore -
        second.rookSafeBlackDistanceScore,
  },
]

export function scoreRookStrategyMove(
  fen: string,
  san: string,
): RookStrategyScore {
  const beforeRook = findPiece(fen, 'w', 'r')
  const beforeWhiteKing = findPiece(fen, 'w', 'k')
  const beforeBlackKing = findPiece(fen, 'b', 'k')
  const beforeRoom =
    beforeRook && beforeBlackKing
      ? rookRoom(beforeRook.square, beforeBlackKing.square)
      : 15
  const beforeKingRookDistance =
    beforeWhiteKing && beforeRook
      ? kingDistance(beforeWhiteKing.square, beforeRook.square)
      : 8
  const criticalSquare =
    beforeRook && beforeBlackKing
      ? rookCriticalSquare(beforeRook.square, beforeBlackKing.square)
      : null
  const beforeCriticalDistance =
    beforeWhiteKing && criticalSquare
      ? manhattanDistance(beforeWhiteKing.square, criticalSquare)
      : 99

  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const whiteRook = findPiece(resultFen, 'w', 'r')
  const whiteKing = findPiece(resultFen, 'w', 'k')
  const blackKing = findPiece(resultFen, 'b', 'k')
  const resultRoom =
    whiteRook && blackKing
      ? rookRoom(whiteRook.square, blackKing.square)
      : 15
  const rookDivides = getRookBoxFromFen(resultFen).size !== null
  const rookExposed = Boolean(
    whiteRook &&
      whiteKing &&
      blackKing &&
      kingDistance(whiteKing.square, whiteRook.square) >
        kingDistance(blackKing.square, whiteRook.square),
  )
  const avoidsSmallRoomTrap = Boolean(
    beforeRook &&
      beforeWhiteKing &&
      whiteRook &&
      whiteKing &&
      blackKing &&
      (resultRoom > 3 ||
        (!kingsOnSameEdge(whiteKing.square, blackKing.square) &&
          (beforeKingRookDistance !== 1 ||
            !isBackMove(
              beforeWhiteKing.square,
              whiteKing.square,
              beforeRook.square,
              beforeBlackKing?.square ?? blackKing.square,
            )))),
  )
  const preservesStrategyShape =
    rookDivides ||
    Boolean(
      whiteRook &&
        whiteKing &&
        blackKing &&
        isRookLPattern(
          whiteKing.square,
          whiteRook.square,
          blackKing.square,
        ),
    )
  const resultCriticalDistance =
    whiteKing && criticalSquare
      ? manhattanDistance(whiteKing.square, criticalSquare)
      : 99
  const resultKingRookDistance =
    whiteKing && whiteRook
      ? kingDistance(whiteKing.square, whiteRook.square)
      : 8
  const commonKingMoveSafety =
    move.piece === 'k' &&
    !rookExposed &&
    avoidsSmallRoomTrap &&
    !chess.isStalemate()
  const approach =
    commonKingMoveSafety &&
    preservesStrategyShape &&
    resultCriticalDistance < beforeCriticalDistance
  const keepsRoom =
    commonKingMoveSafety &&
    rookDivides &&
    resultKingRookDistance <= beforeKingRookDistance
  const rookHome = Boolean(
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
    move.piece === 'r' &&
      beforeRook &&
      whiteRook &&
      whiteKing &&
      blackKing &&
      movedToDifferentEdge(beforeRook.square, whiteRook.square) &&
      kingDistance(whiteRook.square, blackKing.square) > 2 &&
      !chess.isStalemate(),
  )
  const forcesMateNext =
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
  const squeezes = Boolean(
    move.piece === 'r' &&
      resultRoom < beforeRoom &&
      rookDivides &&
      !rookExposed &&
      !chess.isStalemate(),
  )

  return {
    matePenalty: chess.isCheckmate() ? 0 : 1,
    rookCapturePenalty: blackCanTakeWhiteMajorPiece(resultFen, 'r') ? 1 : 0,
    stalematePenalty: !chess.isCheckmate() && chess.isStalemate() ? 1 : 0,
    mateNextPenalty: forcesMateNext ? 0 : 1,
    squeezePenalty: squeezes ? 0 : 1,
    squeezeRoom: squeezes ? resultRoom : 15,
    approachPenalty: approach ? 0 : 1,
    approachDiagonalPenalty:
      approach && beforeWhiteKing && whiteKing
        ? isDiagonalKingMove(beforeWhiteKing.square, whiteKing.square)
          ? 0
          : 1
        : 0,
    approachRookDistance: approach ? resultKingRookDistance : 8,
    keepRoomPenalty: keepsRoom ? 0 : 1,
    keepRoomDiagonalPenalty:
      keepsRoom && beforeWhiteKing && whiteKing
        ? isDiagonalKingMove(beforeWhiteKing.square, whiteKing.square)
          ? 0
          : 1
        : 0,
    keepRoomCriticalDistance:
      keepsRoom ? resultCriticalDistance : 99,
    keepRoomRookDistance: keepsRoom ? resultKingRookDistance : 8,
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

function rookRoom(rookSquare: Square, blackKingSquare: Square): number {
  const rook = squareCoordinates(rookSquare)
  const black = squareCoordinates(blackKingSquare)
  if (rook.file === black.file || rook.rank === black.rank) return 15
  const files = rook.file > black.file ? rook.file : 7 - rook.file
  const ranks = rook.rank > black.rank ? rook.rank : 7 - rook.rank
  return files + ranks
}

function rookCriticalSquare(
  rookSquare: Square,
  blackKingSquare: Square,
): Square {
  const rook = squareCoordinates(rookSquare)
  const black = squareCoordinates(blackKingSquare)
  return squareFromCoordinates(
    rook.file + Math.sign(black.file - rook.file),
    rook.rank + Math.sign(black.rank - rook.rank),
  )!
}

function isRookLPattern(
  whiteKingSquare: Square,
  rookSquare: Square,
  blackKingSquare: Square,
): boolean {
  const white = squareCoordinates(whiteKingSquare)
  const rook = squareCoordinates(rookSquare)
  const black = squareCoordinates(blackKingSquare)
  return (
    (white.rank === black.rank &&
      Math.abs(white.file - black.file) === 2 &&
      rook.file === white.file &&
      Math.abs(rook.rank - white.rank) === 1) ||
    (white.file === black.file &&
      Math.abs(white.rank - black.rank) === 2 &&
      rook.rank === white.rank &&
      Math.abs(rook.file - white.file) === 1)
  )
}

function kingsOnSameEdge(
  whiteKingSquare: Square,
  blackKingSquare: Square,
): boolean {
  const white = squareCoordinates(whiteKingSquare)
  const black = squareCoordinates(blackKingSquare)
  return (
    (white.file === 0 && black.file === 0) ||
    (white.file === 7 && black.file === 7) ||
    (white.rank === 0 && black.rank === 0) ||
    (white.rank === 7 && black.rank === 7)
  )
}

function isBackMove(
  beforeSquare: Square,
  resultSquare: Square,
  rookSquare: Square,
  blackKingSquare: Square,
): boolean {
  const before = squareCoordinates(beforeSquare)
  const result = squareCoordinates(resultSquare)
  const rook = squareCoordinates(rookSquare)
  const black = squareCoordinates(blackKingSquare)
  return (
    (black.file === 0 &&
      rook.file === 1 &&
      result.file < before.file) ||
    (black.file === 7 &&
      rook.file === 6 &&
      result.file > before.file) ||
    (black.rank === 0 &&
      rook.rank === 1 &&
      result.rank < before.rank) ||
    (black.rank === 7 &&
      rook.rank === 6 &&
      result.rank > before.rank)
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
