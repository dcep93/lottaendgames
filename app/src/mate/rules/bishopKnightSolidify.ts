import type { Square } from 'chess.js'
import { findPiece, getChess, SQUARE_TRANSFORMS, transformSquare } from '../chess'

const BISHOP_SQUARES = ['a2', 'b3', 'c4', 'd5', 'e6'] as const
const SETUPS = SQUARE_TRANSFORMS.map(transform => ({
  black: transformSquare('g8', transform),
  knight: transformSquare('f7', transform),
  opposition: transformSquare('g6', transform),
  bishopSquares: BISHOP_SQUARES.map(square => transformSquare(square, transform)),
}))

export function getKnightAndBishopPreparationMoves(fen: string): readonly string[] {
  const white = findPiece(fen, 'w', 'k')
  const black = findPiece(fen, 'b', 'k')
  const knight = findPiece(fen, 'w', 'n')
  const bishop = findPiece(fen, 'w', 'b')
  if (!white || !black || !knight || !bishop) return []
  const desired: {from: Square; to: Square}[] = []
  for (const setup of SETUPS) {
    if (setup.black !== black.square || setup.knight !== knight.square ||
      !setup.bishopSquares.includes(bishop.square) || white.square === setup.opposition) continue
    // The ordered bishop squares run toward the knight; White must not block the x-ray.
    const between = setup.bishopSquares.slice(setup.bishopSquares.indexOf(bishop.square) + 1)
    if (between.includes(white.square)) continue
    desired.push({ from: white.square, to: setup.opposition })
  }
  if (desired.length === 0) return []
  const chess = getChess(fen)
  if (chess.turn() !== 'w') return []
  return chess.moves({ verbose: true }).filter(move =>
    desired.some(target => move.from === target.from && move.to === target.to)).map(move => move.san)
}
