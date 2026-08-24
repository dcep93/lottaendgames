import type { Square } from 'chess.js'
import { getChess } from '../chess'

export function getWhiteBishopSquares(fen: string): Square[] {
  return getChess(fen)
    .board()
    .flat()
    .filter((piece) => piece?.color === 'w' && piece.type === 'b')
    .map((piece) => piece!.square)
}
