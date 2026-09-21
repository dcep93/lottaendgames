import { findPiece, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'

// Only declarations added after the latest reset belong to r5.
const declaredMoves = new Map<string, string>()
for (const [position, from, to] of [
  // First five surviving-loop links; Kh6 for the third is already declared below.
  ['6k1/8/7K/8/4B3/3N4/8/8 w - - 0 1', 'h6', 'g6'],
  ['8/8/8/8/1K6/N7/1k6/7B w - - 0 1', 'a3', 'b5'],
  ['8/8/8/8/8/2K5/1N6/1k5B w - - 0 1', 'b2', 'c4'],
  ['8/8/8/4k3/3NB3/3K4/8/8 w - - 0 1', 'd3', 'e3'],
  // Aligned precage-loop prescriptions: Be4/Nd3, plus the Nc5 entry move.
  ['8/5k2/8/8/4B3/3NK3/8/8 w - - 0 1', 'e3', 'f4'],
  ['8/8/4k3/8/4B3/3NK3/8/8 w - - 0 1', 'e3', 'f4'],
  ['8/4k3/8/8/4B3/3NK3/8/8 w - - 0 1', 'e3', 'f4'],
  ['8/3k4/8/8/4B3/3NK3/8/8 w - - 0 1', 'e3', 'f4'],
  ['8/8/5k2/8/4B3/3NK3/8/8 w - - 0 1', 'e3', 'f4'],
  ['8/6k1/8/8/3KB3/3N4/8/8 w - - 0 1', 'd4', 'e5'],
  ['8/8/7k/4K3/4B3/3N4/8/8 w - - 0 1', 'e5', 'f6'],
  ['8/8/8/4K1k1/4B3/3N4/8/8 w - - 0 1', 'e5', 'e6'],
  ['8/6k1/8/2N5/3KB3/8/8/8 w - - 0 1', 'd4', 'e5'],
  ['8/4k3/8/2N5/3KB3/8/8/8 w - - 2 2', 'd4', 'e5'],
  ['8/8/3N4/2KBk3/8/8/8/8 w - - 0 1', 'd6', 'c4'],
  ['8/8/4k3/8/3KB3/3N4/8/8 w - - 2 2', 'd4', 'e3'],
  ['8/8/3k4/8/4B3/3NK3/8/8 w - - 4 3', 'e3', 'f4'],
  ['8/8/4k3/8/4BK2/3N4/8/8 w - - 6 4', 'f4', 'g5'],
  ['8/8/3k4/6K1/4B3/3N4/8/8 w - - 8 5', 'g5', 'f6'],
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

const kingPreparationByWhitePlacement = new Map(SQUARE_TRANSFORMS.map(transform => [
  (['c5', 'd5', 'd4'] as const).map(square => transformSquare(square, transform)).join('/'),
  transformSquare('c5', transform) + transformSquare('d6', transform),
]))

export function knightAndBishopDeclaredPreparationMove(fen: string): string | undefined {
  const exact = declaredMoves.get(fen.split(' ').slice(0, 2).join(' '))
  if (exact || fen.split(' ')[1] !== 'w') return exact
  const bishop = findPiece(fen, 'w', 'b')
  const knight = findPiece(fen, 'w', 'n')
  const whiteKing = findPiece(fen, 'w', 'k')
  const kingPreparation = whiteKing && bishop && knight
    ? kingPreparationByWhitePlacement.get(`${whiteKing.square}/${bishop.square}/${knight.square}`)
    : undefined
  if (kingPreparation) return kingPreparation
  const blackKing = findPiece(fen, 'b', 'k')
  return bishop && knight && blackKing
    ? knightPreparationByPlacement.get(`${bishop.square}/${knight.square}/${blackKing.square}`)
    : undefined
}
