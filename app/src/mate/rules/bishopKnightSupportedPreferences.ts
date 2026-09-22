import { SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'

// Exact r2.5 declarations, subordinate to r1.5; counters do not affect placement.
const declarations = new Map(([
  ['8/2K5/8/k7/8/1B1N4/8/8 w - - 0 1', 'c7', 'c6'],
  ['8/8/k1K5/8/8/1B1N4/8/8 w - - 0 1', 'c6', 'c5'],
  ['8/8/3K4/1k6/8/1B1N4/8/8 w - - 0 1', 'd6', 'd5'],
  ['8/5K2/3k4/8/8/1B1N4/8/8 w - - 0 1', 'f7', 'e8'],
  ['5K2/8/3k4/8/8/1B1N4/8/8 w - - 0 1', 'f8', 'e8'],
] as const).flatMap(([fen, from, to]) => SQUARE_TRANSFORMS.map(transform => [
  transformFen(fen,transform).split(' ').slice(0,2).join(' '),
  transformSquare(from,transform) + transformSquare(to,transform),
] as const)))

export function declaredSupportedSevenMove(fen: string): string | undefined {
  return declarations.get(fen.split(' ').slice(0,2).join(' '))
}

const fiveDeclarations = new Map(([
  ['8/3B4/3K4/k7/8/3N4/8/8 w - - 0 1', 'd6', 'c5'],
  ['8/8/k1K5/3N4/B7/8/8/8 w - - 0 1', 'c6', 'c5'],
] as const).flatMap(([fen, from, to]) => SQUARE_TRANSFORMS.map(transform => [
  transformFen(fen, transform).split(' ').slice(0, 2).join(' '),
  transformSquare(from, transform) + transformSquare(to, transform),
] as const)))

export function declaredSupportedFiveMove(fen: string): string | undefined {
  return fiveDeclarations.get(fen.split(' ').slice(0, 2).join(' '))
}

const threeDeclarations = new Map(SQUARE_TRANSFORMS.map(transform => [
  transformFen('8/k7/B1K5/3N4/8/8/8/8 w - - 0 1', transform).split(' ').slice(0, 2).join(' '),
  transformSquare('c6', transform) + transformSquare('b5', transform),
] as const))

export function declaredSupportedThreeMove(fen: string): string | undefined {
  return threeDeclarations.get(fen.split(' ').slice(0, 2).join(' '))
}
