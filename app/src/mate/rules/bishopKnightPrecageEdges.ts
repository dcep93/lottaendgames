import type { Square } from 'chess.js'
import { findPiece, squareCoordinates } from '../chess'
import { knightAndBishopKnightTargetSquares } from './bishopKnightStrategy'

export type BoardEdge = 'left' | 'right' | 'top' | 'bottom'

export function kingEdgeDistance(square: Square, edge: BoardEdge | undefined): number {
  const { file, rank } = squareCoordinates(square)
  switch (edge) {
    case 'left': return file
    case 'right': return 7 - file
    case 'top': return 7 - rank
    case 'bottom': return rank
    default: return 0
  }
}

export function precageKingEdges(fen: string): readonly BoardEdge[] {
  const bishop = findPiece(fen, 'w', 'b')
  const knight = findPiece(fen, 'w', 'n')
  if (!bishop || !knight || !knightAndBishopKnightTargetSquares(fen).includes(knight.square)) return []
  const { file, rank } = squareCoordinates(bishop.square)
  const near: BoardEdge[] = [file < 4 ? 'left' : 'right', rank < 4 ? 'bottom' : 'top']
  const primary = near.find(edge => kingEdgeDistance(knight.square, edge) > kingEdgeDistance(bishop.square, edge))
  const secondary = near.find(edge => kingEdgeDistance(knight.square, edge) < kingEdgeDistance(bishop.square, edge))
  return primary && secondary ? [primary, secondary] : []
}
