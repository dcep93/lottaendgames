import type { Square } from 'chess.js'
import { findPiece, squareColor, squareCoordinates } from '../chess'
import { knightAndBishopKnightTargetSquares } from './bishopKnightStrategy'

export type PrecageSideTarget = {
  axis: 'file' | 'rank'
  edge: number
  corner: Square
}

// Freeze the bishop half opposite the eligible precage knight and its non-target corner before White moves.
export function knightAndBishopPrecageSideTarget(fen: string): PrecageSideTarget | undefined {
  const bishop = findPiece(fen, 'w', 'b')
  const knight = findPiece(fen, 'w', 'n')
  if (!bishop || !knight || !knightAndBishopKnightTargetSquares(fen).includes(knight.square)) return
  const b = squareCoordinates(bishop.square), n = squareCoordinates(knight.square)
  for (const axis of ['file', 'rank'] as const) {
    const high = b[axis] >= 4
    if ((n[axis] >= 4) === high) continue
    const edge = high ? 7 : 0
    const corner = (['a1', 'a8', 'h1', 'h8'] as const).find(square =>
      squareCoordinates(square)[axis] === edge && squareColor(square) !== squareColor(bishop.square))!
    return { axis, edge, corner }
  }
}
