import {SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';

// Exact starting placement only; ignore clocks and apply D4, not translations.
const sources = [
  '1k6/8/B7/1K6/1N6/8/8/8 w - - 0 1',
  '8/k7/B7/1K6/1N6/8/8/8 w - - 0 1',
];
const moves = new Map(sources.flatMap(fen => SQUARE_TRANSFORMS.map(transform => [
  transformFen(fen, transform).split(' ')[0],
  transformSquare('b5', transform) + transformSquare('c5', transform),
] as const)));

export function declaredKnightDefenseMove(fen: string): string | undefined {
  const [placement, turn] = fen.split(' ');
  return turn === 'w' ? moves.get(placement!) : undefined;
}
