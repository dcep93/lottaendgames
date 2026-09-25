import type { Square } from 'chess.js'
import { edgeDistance, findPiece, kingDistance, squareCoords, squareFromCoords } from '../chess'
import { knightAndBishopKnightProximityToSquare } from './bishopKnightStrategy'

/** Bishop-protected targets, except squares adjacent to an edge bishop.
 * Preserve x-ray protection through Black's king. The knight's current square
 * does not block a ray used to plan where that knight should move.
 */
export function stableBishopProtectedSquares(fen: string): Square[] {
  const bishop = findPiece(fen, 'w', 'b')
  if (!bishop) return []
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const origin = squareCoords(bishop.square)
  const targets: Square[] = []
  for (const [df, dr] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    for (let step = 1; step < 8; step++) {
      const square = squareFromCoords(origin.file + df! * step, origin.rank + dr! * step)
      if (!square || square === whiteKing) break
      if (square === blackKing) continue
      if (edgeDistance(bishop.square) === 0 && kingDistance(bishop.square, square) === 1) continue
      targets.push(square)
    }
  }
  return targets
}

export function stableBishopProtectionDistance(fen: string): number {
  const targets = stableBishopProtectedSquares(fen)
  return targets.length ? Math.min(...targets.map(square => knightAndBishopKnightProximityToSquare(fen, square))) : 99
}
