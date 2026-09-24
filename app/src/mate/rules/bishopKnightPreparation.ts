import { SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'

// Exact r5 declarations; counters do not affect placement. All earlier rules retain priority.
const declarations = new Map(([
  ['8/2k5/5K2/3B4/2N5/8/8/8 w - - 0 1', 'f6', 'e7'],
  ['2k5/4K3/8/3B4/2N5/8/8/8 w - - 2 2', 'c4', 'e5'],
  ['8/8/8/3B4/2Nk1K2/8/8/8 w - - 0 1', 'd5', 'e6'],
  ['7k/8/4NK2/3B4/8/8/8/8 w - - 2 2', 'e6', 'd8'],
  ['3N4/7k/5K2/3B4/8/8/8/8 w - - 4 3', 'd8', 'f7'],
  ['6k1/5N2/5K2/3B4/8/8/8/8 w - - 6 4', 'd5', 'e4'],
  ['5k2/5N2/5K2/8/4B3/8/8/8 w - - 8 5', 'e4', 'h7'],
  ['4k3/5N1B/5K2/8/8/8/8/8 w - - 10 6', 'f7', 'e5'],
  ['3k4/7B/5K2/4N3/8/8/8/8 w - - 12 7', 'h7', 'g8'],
] as const).flatMap(([fen, from, to]) => SQUARE_TRANSFORMS.map(transform => [
  transformFen(fen, transform).split(' ').slice(0, 2).join(' '),
  transformSquare(from, transform) + transformSquare(to, transform),
] as const)))

export function knightAndBishopDeclaredPreparationMove(fen: string): string | undefined {
  return declarations.get(fen.split(' ').slice(0, 2).join(' '))
}
