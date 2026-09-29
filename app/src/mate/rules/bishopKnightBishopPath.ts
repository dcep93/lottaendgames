import type {Square} from 'chess.js';
import {allSquares, findPiece, isKnightMove, kingDistance, squareColor, squareCoordinates, squareFromCoords, squaredEuclideanDistance, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';

const squares = allSquares();
const centers = ['d4', 'e4', 'd5', 'e5'] as const;
const centralDistance = (square: Square) => Math.min(...centers.map(center => squaredEuclideanDistance(square, center)));
const declaredDestinations = new Map(SQUARE_TRANSFORMS.map(transform => [
  transformFen('8/8/8/3B4/3k4/8/5N2/4K3 w - - 0 1', transform).split(' ')[0],
  transformSquare('a8', transform),
] as const));

/** Static bishop routes that break Black's blockade of a central king step. */
export function bishopCentralPathDistances(fen: string): ReadonlyMap<Square, number> {
  const [placement, turn] = fen.split(' ');
  const declared = turn === 'w' ? declaredDestinations.get(placement) : undefined;
  if (declared) return new Map([[declared, 0]]);
  const king = findPiece(fen, 'w', 'k')?.square;
  const knight = findPiece(fen, 'w', 'n')?.square;
  const bishop = findPiece(fen, 'w', 'b')?.square;
  const black = findPiece(fen, 'b', 'k')?.square;
  if (!king || !knight || !bishop || !black) return new Map();
  const protectedKnight = kingDistance(king, knight) === 1;
  const advances = squares.filter(square => kingDistance(square, king) === 1
    && square !== knight && square !== bishop
    && centralDistance(square) < centralDistance(king)
    && (!protectedKnight || kingDistance(square, knight) === 1));
  if (!advances.length || advances.some(square => kingDistance(square, black) > 1)) return new Map();

  // Same-color squares on which Black can continue blocking every advance.
  const blockers = squares.filter(square => kingDistance(square, black) <= 1
    && squareColor(square) === squareColor(bishop)
    && kingDistance(square, king) > 1 && !isKnightMove(knight, square)
    && square !== knight && advances.every(advance => kingDistance(square, advance) <= 1));
  if (!blockers.length) return new Map();
  const occupied = new Set([king, knight, black]);
  const rays = (from: Square): Square[] => {
    const origin = squareCoordinates(from), result: Square[] = [];
    for (const dx of [-1, 1]) for (const dy of [-1, 1]) for (let step = 1; step < 8; step++) {
      const square = squareFromCoords(origin.file + step * dx, origin.rank + step * dy);
      if (!square) break;
      result.push(square);
      if (occupied.has(square)) break;
    }
    return result;
  };
  const safe = (square: Square) => !occupied.has(square)
    && (kingDistance(square, black) > 1 || kingDistance(square, king) === 1 || isKnightMove(knight, square));
  const available = squares.filter(square => squareColor(square) === squareColor(bishop) && safe(square));
  const goals = available.filter(square => !advances.includes(square)
    && blockers.some(blocker => rays(square).includes(blocker)));
  const distances = new Map<Square, number>(goals.map(square => [square, 0]));
  const queue = [...goals];
  for (let i = 0; i < queue.length; i++) {
    const from = queue[i]!;
    for (const square of rays(from)) if (safe(square) && !distances.has(square)) {
      distances.set(square, distances.get(from)! + 1);
      queue.push(square);
    }
  }
  return distances;
}
