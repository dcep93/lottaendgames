import { isInsideBishopDiagonal } from './bishopKnightGeometry'
import { edgeDistance, findPiece, kingDistance, squaredEuclideanDistance, SQUARE_TRANSFORMS, transformSquare } from '../chess'

const PATTERNS = SQUARE_TRANSFORMS.map(transform => ({
  wall: (['a4', 'b5', 'c6', 'd7', 'e8'] as const).map(square => transformSquare(square, transform)),
  knight: transformSquare('d5', transform),
  sevenKnight: transformSquare('d3', transform),
  b6BlackKing: transformSquare('b6', transform),
  b4KingTarget: transformSquare('b4', transform),
  sevenSupportKingTargets: (['c5', 'd6'] as const).map(square => transformSquare(square, transform)),
  corner: transformSquare('a8', transform),
  kingSquares: (['a5', 'b6', 'c7', 'd8'] as const).map(square => transformSquare(square, transform)),
  preferredKingSquares: (['b6', 'c7'] as const).map(square => transformSquare(square, transform)),
  secondaryKingSquares: (['b5', 'd7'] as const).map(square => transformSquare(square, transform)),
  approachSquares: (['b4', 'e7'] as const).map(square => transformSquare(square, transform)),
}))

/** Score the position after White moves. */
export function fiveDiagonalPressureScore(fen: string): {king: number; bishop: number; approach: number | null; cornerProximity: number; sevenSupportKingProximity: number} {
  const white = findPiece(fen, 'w', 'k')
  const bishop = findPiece(fen, 'w', 'b')
  const knight = findPiece(fen, 'w', 'n')
  const black = findPiece(fen, 'b', 'k')
  if (!white || !bishop || !black || !knight) return {king: 0, bishop: 0, approach: null, cornerProximity: 0, sevenSupportKingProximity: 0}
  const walls = PATTERNS.filter(pattern => isInsideBishopDiagonal(black.square, pattern.wall) && pattern.wall.includes(bishop.square))
  const patterns = walls.filter(pattern => knight.square === pattern.knight)
  if (!patterns.length) {
    const sevenSupported = walls.filter(pattern => knight.square === pattern.sevenKnight)
    return sevenSupported.length ? {
      sevenSupportKingProximity: Math.min(...sevenSupported.flatMap(pattern => (black.square === pattern.b6BlackKing ? [pattern.b4KingTarget] : pattern.sevenSupportKingTargets)
        .map(square => squaredEuclideanDistance(white.square, square)))),
      bishop: 0,
      king: squaredEuclideanDistance(white.square, bishop.square),
      approach: null,
      cornerProximity: 0,
    } : {king: 0, bishop: 0, approach: null, cornerProximity: 0, sevenSupportKingProximity: 0}
  }
  const approachPatterns = patterns.filter(pattern => kingDistance(black.square, pattern.corner) >= 2)
  const approach = approachPatterns.length ? Math.min(...approachPatterns.flatMap(pattern => {
    const nearest = Math.min(...pattern.approachSquares.map(square => kingDistance(black.square, square)))
    return pattern.approachSquares.filter(square => kingDistance(black.square, square) === nearest)
      .map(square => kingDistance(white.square, square))
  })) : null
  return {
    sevenSupportKingProximity: 0,
    king: patterns.some(pattern => pattern.preferredKingSquares.includes(white.square)) ? 0
      : patterns.some(pattern => pattern.secondaryKingSquares.includes(white.square)) ? 1
      : patterns.some(pattern => pattern.kingSquares.includes(white.square)) ? 2 : 3,
    approach,
    cornerProximity: Math.min(...patterns.map(pattern => kingDistance(white.square, pattern.corner))),
    bishop: edgeDistance(bishop.square) === 1 ? 0 : 1,
  }
}
