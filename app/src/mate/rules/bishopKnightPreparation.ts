import { findPiece, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'

// Only declarations added after the latest reset belong to r5.
const declaredMoves = new Map<string, string>()
for (const [position, from, to] of [
  ['8/5k2/8/6K1/4B3/3N4/8/8 w - - 2 2', 'g5', 'h6'],
  ['8/5k2/3K4/8/4B3/3N4/8/8 w - - 0 1', 'd6', 'e5'],
  ['8/2k5/8/3K4/4B3/3N4/8/8 w - - 0 1', 'd5', 'e6'],
  ['8/4k3/2K5/8/4B3/3N4/8/8 w - - 0 1', 'c6', 'd5'],
  ['4k3/2K5/8/8/4B3/3N4/8/8 w - - 0 1', 'c7', 'd6'],
  ['8/5k2/8/5K2/4B3/3N4/8/8 w - - 2 2', 'f5', 'g5'],
  ['8/8/3K1k2/8/4B3/3N4/8/8 w - - 2 2', 'd6', 'd5'],
  ['8/8/3k4/8/4BKN1/8/8/8 w - - 0 1', 'f4', 'f5'],
] as const) {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position, transform)
    declaredMoves.set(fen.split(' ').slice(0, 2).join(' '),
      transformSquare(from, transform) + transformSquare(to, transform))
  }
}

const knightPreparationByPlacement = new Map(SQUARE_TRANSFORMS.map(transform => [
  (['g4', 'h6', 'g6'] as const).map(square => transformSquare(square, transform)).join('/'),
  transformSquare('h6', transform) + transformSquare('f5', transform),
]))

export function knightAndBishopDeclaredPreparationMove(fen: string): string | undefined {
  const exact = declaredMoves.get(fen.split(' ').slice(0, 2).join(' '))
  if (exact || fen.split(' ')[1] !== 'w') return exact
  const bishop = findPiece(fen, 'w', 'b')
  const knight = findPiece(fen, 'w', 'n')
  const blackKing = findPiece(fen, 'b', 'k')
  return bishop && knight && blackKing
    ? knightPreparationByPlacement.get(`${bishop.square}/${knight.square}/${blackKing.square}`)
    : undefined
}
