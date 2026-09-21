import { SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'

// Exact r2.5 declarations, subordinate to r1.5; counters do not affect placement.
const declarations = new Map(([
  ['8/5K2/3k4/8/8/1B1N4/8/8 w - - 0 1', 'f7', 'e8'],
  ['5K2/8/3k4/8/8/1B1N4/8/8 w - - 0 1', 'f8', 'e8'],
] as const).flatMap(([fen, from, to]) => SQUARE_TRANSFORMS.map(transform => [
  transformFen(fen,transform).split(' ').slice(0,2).join(' '),
  transformSquare(from,transform) + transformSquare(to,transform),
] as const)))

export function declaredSupportedSevenMove(fen: string): string | undefined {
  return declarations.get(fen.split(' ').slice(0,2).join(' '))
}
