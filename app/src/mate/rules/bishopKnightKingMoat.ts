import type { Square } from 'chess.js';
import { squareCoordinates } from '../chess';

export type KingMoatSide = {
  readonly axis: 'file' | 'rank';
  readonly boundary: number;
  readonly direction: number;
};

/** Black's region starts beyond the line immediately beside White's king. */
export function blackKingMoatSides(whiteKing: Square, blackKing: Square): readonly KingMoatSide[] {
  const white = squareCoordinates(whiteKing), black = squareCoordinates(blackKing);
  const span = Math.max(Math.abs(black.file - white.file), Math.abs(black.rank - white.rank));
  if (span < 2) return [];
  return (['file', 'rank'] as const).flatMap(axis => {
    const delta = black[axis] - white[axis];
    if (Math.abs(delta) !== span) return [];
    const direction = Math.sign(delta);
    return [{axis, direction, boundary: white[axis] + 2 * direction}];
  });
}

/** Euclidean distance to the nearest Black-side region; zero inside either region. */
export function knightDistanceFromBlackMoatSide(knight: Square, sides: readonly KingMoatSide[]): number {
  const point = squareCoordinates(knight);
  return sides.length ? Math.min(...sides.map(({axis, boundary, direction}) =>
    Math.max(0, (boundary - point[axis]) * direction))) : 0;
}
