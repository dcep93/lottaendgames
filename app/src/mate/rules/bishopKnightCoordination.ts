import { findPiece, kingDistance, manhattanDistance } from '../chess';
import { centerDistance } from './bishopKnightGeometry';

/** r8's arrangement is measured before White moves. */
export function knightAndBishopShouldCoordinateKing(fen: string): boolean {
  const bishop = findPiece(fen, 'w', 'b');
  const knight = findPiece(fen, 'w', 'n');
  const whiteKing = findPiece(fen, 'w', 'k');
  const blackKing = findPiece(fen, 'b', 'k');
  if (!bishop || !knight || !whiteKing || !blackKing) return false;
  return centerDistance(bishop.square) === 0
    && manhattanDistance(bishop.square, blackKing.square) === 1
    && kingDistance(bishop.square, whiteKing.square) === 1
    && manhattanDistance(bishop.square, whiteKing.square) === 2
    && manhattanDistance(whiteKing.square, knight.square) === 1
    && kingDistance(bishop.square, knight.square) > 1;
}

export function knightAndBishopKingCoordinatesMinors(fen: string): boolean {
  const bishop = findPiece(fen, 'w', 'b');
  const knight = findPiece(fen, 'w', 'n');
  const king = findPiece(fen, 'w', 'k');
  return !!bishop && !!knight && !!king
    && manhattanDistance(king.square, bishop.square) === 1
    && kingDistance(king.square, knight.square) === 1;
}
