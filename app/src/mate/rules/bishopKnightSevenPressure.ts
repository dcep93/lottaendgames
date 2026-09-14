import { isInsideBishopDiagonal } from './bishopKnightGeometry'
import { findPiece, SQUARE_TRANSFORMS, squaredEuclideanDistance, transformSquare } from '../chess'

const PATTERNS = SQUARE_TRANSFORMS.map(transform => ({
  wall: (['a2', 'b3', 'c4', 'd5', 'e6', 'f7', 'g8'] as const).map(square => transformSquare(square, transform)),
  knight: transformSquare('d3', transform),
  white: transformSquare('g7', transform),
  bishop: transformSquare('f7', transform),
  black: transformSquare('e7', transform),
  firstKingSquare: transformSquare('e6', transform),
  kingTarget: transformSquare('e7', transform),
  bishopTarget: transformSquare('b3', transform),
  secondBishopTarget: transformSquare('c4', transform),
  blackSide: (['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'] as const).map(square => transformSquare(square, transform)),
  sideKingTarget: transformSquare('c5', transform),
  innerBlackSquares: (['c6', 'b5', 'b6'] as const).map(square => transformSquare(square, transform)),
  innerKingTarget: transformSquare('d6', transform),
  upperBlackSquares: (['e7', 'e8', 'f8'] as const).map(square => transformSquare(square, transform)),
  upperKingTarget: transformSquare('g7', transform),
  bishopFirstBlack: transformSquare('a5', transform),
  edgeRouteBlack: (['a3', 'a4'] as const).map(square => transformSquare(square, transform)),
  edgeRouteKing: (['b2', 'c2', 'c3', 'd4'] as const).map(square => transformSquare(square, transform)),
}))

/** Fix the diagonal's orientation before comparing White's candidate moves. */
export function sevenDiagonalPressureContext(fen: string) {
  const bishop = findPiece(fen, 'w', 'b')
  const knight = findPiece(fen, 'w', 'n')
  const black = findPiece(fen, 'b', 'k')
  return PATTERNS.filter(pattern => black && isInsideBishopDiagonal(black.square, pattern.wall) && knight?.square === pattern.knight && bishop && pattern.wall.includes(bishop.square))
}

export function sevenDiagonalPressureScore(fen: string, patterns: ReturnType<typeof sevenDiagonalPressureContext>): number {
  if (!patterns.length) return 0
  const white = findPiece(fen, 'w', 'k')
  const bishop = findPiece(fen, 'w', 'b')
  const knight = findPiece(fen, 'w', 'n')
  const black = findPiece(fen, 'b', 'k')
  if (!white || !bishop || !knight || !black) return 100
  return Math.min(...patterns.map(pattern => {
    if (pattern.edgeRouteBlack.includes(black.square)) {
      const routeIndex = pattern.edgeRouteKing.indexOf(white.square)
      return routeIndex >= 0 ? routeIndex : 4 + squaredEuclideanDistance(white.square, pattern.edgeRouteKing[3]!)
    }
    // The existing score is at most 101, so each squared-distance step takes precedence over every tie-break.
    // This tier exceeds every c5-distance score and its tie-breaks (128 * 98 + 101).
    const bishopFirstScore = black.square === pattern.bishopFirstBlack && bishop.square !== pattern.bishopTarget ? 16384 : 0
    const kingTarget = pattern.upperBlackSquares.includes(black.square) ? pattern.upperKingTarget
      : pattern.innerBlackSquares.includes(black.square) ? pattern.innerKingTarget
      : pattern.blackSide.includes(black.square) ? pattern.sideKingTarget : null
    const sideScore = bishopFirstScore + (kingTarget ? 128 * squaredEuclideanDistance(white.square, kingTarget) : 0)
    if (white.square === pattern.white && bishop.square === pattern.bishop &&
      knight.square === pattern.knight && black.square === pattern.black) return sideScore
    if (white.square === pattern.firstKingSquare) return sideScore + 1
    return sideScore + 3 + squaredEuclideanDistance(white.square, pattern.kingTarget)
  }))
}
