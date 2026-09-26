import type { Square } from 'chess.js';
import { findPiece, manhattanDistance, squareColor, squareCoordinates } from '../chess';

const CENTRAL: readonly Square[] = ['d4', 'e4', 'd5', 'e5'];

/** Two diagonal steps inward from a corner, then two more to the knight. */
export function knightAndBishopR3Target(fen: string): Square | undefined {
  const white = findPiece(fen, 'w', 'k')?.square;
  const black = findPiece(fen, 'b', 'k')?.square;
  const knight = findPiece(fen, 'w', 'n')?.square;
  const bishop = findPiece(fen, 'w', 'b')?.square;
  if (!white || !black || !knight || !bishop
    || !CENTRAL.includes(white) || !CENTRAL.includes(knight)
    || squareColor(black) === squareColor(bishop)
    || manhattanDistance(white, knight) !== 1) return undefined;
  const b = squareCoordinates(black), n = squareCoordinates(knight);
  if (![2, 5].includes(b.file) || ![2, 5].includes(b.rank)
    || Math.abs(b.file - n.file) !== 2 || Math.abs(b.rank - n.rank) !== 2) return undefined;
  return CENTRAL.find(square => square !== white && square !== bishop
    && manhattanDistance(square, knight) === 1);
}
