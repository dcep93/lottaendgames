import type {Square} from 'chess.js';
import {allSquares, findPiece, isKnightMove, kingDistance, squareColor} from '../chess';
import {centerDistance, isMiddle16Square} from './bishopKnightGeometry';

/** Route around a central-four king, keeping every knight landing in the central 16. */
export function protectedCentralManeuverTargets(fen: string): readonly Square[] {
  const king = findPiece(fen, 'w', 'k')?.square;
  const knight = findPiece(fen, 'w', 'n')?.square;
  const bishop = findPiece(fen, 'w', 'b')?.square;
  const black = findPiece(fen, 'b', 'k')?.square;
  if (!king || !knight || !bishop || centerDistance(king) !== 0 || kingDistance(king, knight) !== 1) return [];
  const squares = allSquares().filter(square => isMiddle16Square(square)
    && kingDistance(king, square) === 1 && square !== bishop && square !== black);
  const goals = squares.filter(square => ['d4', 'e4', 'd5', 'e5'].includes(square)
    && squareColor(square) !== squareColor(bishop));
  const distance = new Map<Square, number>(goals.map(square => [square, 0]));
  const queue = [...goals];
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]!;
    for (const square of squares) {
      if (!distance.has(square) && isKnightMove(current, square)) {
        distance.set(square, distance.get(current)! + 1);
        queue.push(square);
      }
    }
  }
  const remaining = distance.get(knight);
  if (!remaining) return [];
  return squares.filter(square => isKnightMove(knight, square) && distance.get(square) === remaining - 1);
}
