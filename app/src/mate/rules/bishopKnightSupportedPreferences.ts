import { SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'

// Exact r2.5 declarations, subordinate to r1.5; counters do not affect placement.
const declarations = new Map(SQUARE_TRANSFORMS.map(transform => [
  transformFen('8/5K2/3k4/8/8/1B1N4/8/8 w - - 0 1',transform).split(' ').slice(0,2).join(' '),
  transformSquare('f7',transform) + transformSquare('e8',transform),
]))

export function declaredSupportedSevenMove(fen: string): string | undefined {
  return declarations.get(fen.split(' ').slice(0,2).join(' '))
}
