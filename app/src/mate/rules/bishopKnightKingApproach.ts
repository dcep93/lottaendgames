import type {Square} from 'chess.js';
import {allSquares, findPiece, kingDistance, squareCoordinates} from '../chess';

const squares = allSquares();
const neighbors = new Map(squares.map(square => [square, squares.filter(next => kingDistance(square, next) === 1)]));

/** King steps toward knight protection, routing around the bishop–knight ray. */
export function kingApproachKnightTargets(fen: string): readonly Square[] {
  const king = findPiece(fen, 'w', 'k')?.square;
  const knight = findPiece(fen, 'w', 'n')?.square;
  const bishop = findPiece(fen, 'w', 'b')?.square;
  const black = findPiece(fen, 'b', 'k')?.square;
  if (!king || !knight || !bishop || !black) return [];
  if (kingDistance(king, knight) === 1) return [];
  const b = squareCoordinates(bishop), n = squareCoordinates(knight), k = squareCoordinates(king);
  const legalSquare = (square: Square) => square !== bishop && square !== knight && kingDistance(square, black) > 1;
  const steps = neighbors.get(king)!.filter(square => {
    const p = squareCoordinates(square);
    const fewerSteps = kingDistance(square, knight) < kingDistance(king, knight);
    const noBackwardComponent = Math.abs(p.file - n.file) <= Math.abs(k.file - n.file)
      && Math.abs(p.rank - n.rank) <= Math.abs(k.rank - n.rank);
    return legalSquare(square) && (fewerSteps || noBackwardComponent);
  });
  const direct = steps;
  if (Math.abs(b.file - n.file) !== Math.abs(b.rank - n.rank)) {
    return direct;
  }
  const screens = (square: Square) => {
    const p = squareCoordinates(square);
    return Math.abs(p.file - b.file) === Math.abs(p.rank - b.rank)
      && p.file > Math.min(b.file, n.file) && p.file < Math.max(b.file, n.file)
      && p.rank > Math.min(b.rank, n.rank) && p.rank < Math.max(b.rank, n.rank);
  };
  const clear = direct.filter(square => !screens(square));
  // Detour only when screening is what prevents a direct legal approach.
  // If no geometric approach is legal, leave the later rules a turn.
  if (clear.length || !direct.length) return clear;
  // A static geometric route, not a search through Black's possible replies.
  const available = new Set(squares.filter(square => legalSquare(square) && !screens(square)));
  const goals = [...available].filter(square => kingDistance(square, knight) === 1);
  const distance = new Map<Square, number>(goals.map(square => [square, 0]));
  const queue = [...goals];
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]!;
    for (const next of neighbors.get(current)!) {
      if (available.has(next) && !distance.has(next)) {
        distance.set(next, distance.get(current)! + 1);
        queue.push(next);
      }
    }
  }
  // A king already screening the ray may step off it onto a route.
  const remaining = distance.get(king) ?? 1 + Math.min(...steps.map(square => distance.get(square) ?? Infinity));
  return steps.filter(square => (distance.get(square) ?? Infinity) < remaining);
}
