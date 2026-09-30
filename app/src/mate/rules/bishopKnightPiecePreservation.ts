import type {Square} from 'chess.js';
import {getEndgamePiecePlacements, SQUARE_TRANSFORMS, transformSquare} from '../chess';
import data from './bishopKnightPiecePreservationData.json';

const squares = Array.from({length: 64}, (_, i) =>
  ('abcdefgh'[i & 7]! + ((i >> 3) + 1)) as Square);
const index = (square: Square) => square.charCodeAt(0) - 97 + (Number(square[1]) - 1) * 8;
const transforms = SQUARE_TRANSFORMS.map(transform => {
  const forward = squares.map(square => index(transformSquare(square, transform)));
  const inverse: number[] = [];
  forward.forEach((to, from) => { inverse[to] = from; });
  return {forward, inverse};
});
const moves = new Map<number, number>(data.moves.map(([source, move]) => [source!, move!]));

/** Exact White-to-move KBNvK placements, reduced by D4; clocks are immaterial. */
export function bishopKnightPiecePreservationMoves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  const pieces = getEndgamePiecePlacements(fen);
  if (pieces.length !== 4) return [];
  const ordered = ([['w', 'k'], ['w', 'b'], ['w', 'n'], ['b', 'k']] as const)
    .map(([color, type]) => pieces.find(piece => piece.color === color && piece.type === type)?.square);
  if (ordered.some(square => !square)) return [];
  const [king, bishop, knight, black] = ordered.map(square => index(square!));
  const result = new Set<string>();
  for (const {forward, inverse} of transforms) {
    const key = (forward[king!]! << 18) | (forward[bishop!]! << 12)
      | (forward[knight!]! << 6) | forward[black!]!;
    const move = moves.get(key);
    if (move !== undefined) result.add(squares[inverse[move >> 6]!]! + squares[inverse[move & 63]!]!);
  }
  return [...result];
}
