import { findPiece, squaredEuclideanDistance, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'

// These declared resulting placements establish support; they do not prefer a move.
const SUPPORTED_RESULTS = new Set([
  '1kB5/8/1K1N4/8/8/8/8/8 b - - 0 1',
  '1k6/1N6/BK6/8/8/8/8/8 b - - 0 1',
  '2k5/1N6/B1K5/8/8/8/8/8 b - - 0 1',
  '1k6/8/B1K5/N7/8/8/8/8 b - - 0 1',
].flatMap(fen => SQUARE_TRANSFORMS.map(transform =>
  transformFen(fen, transform).split(' ').slice(0, 2).join(' '))))

export function isRecordedSupportedCornerPosition(fen: string): boolean {
  return SUPPORTED_RESULTS.has(fen.split(' ').slice(0, 2).join(' '))
}

const FIVE_KING_DEFENSE = SQUARE_TRANSFORMS.map(transform => ({
  bishop: transformSquare('c6', transform),
  black: transformSquare('c7', transform),
  target: transformSquare('d5', transform),
}))

/** This declared placement permits the king to occupy the knight's d5 target. */
export function isRecordedSupportedFiveKingDefense(fen: string): boolean {
  if (fen.split(' ')[1] !== 'b') return false
  const bishop = findPiece(fen, 'w', 'b')
  const white = findPiece(fen, 'w', 'k')
  const black = findPiece(fen, 'b', 'k')
  const knight = findPiece(fen, 'w', 'n')
  return Boolean(knight && FIVE_KING_DEFENSE.some(pattern =>
    pattern.bishop === bishop?.square && pattern.target === white?.square &&
    pattern.black === black?.square && squaredEuclideanDistance(knight.square, pattern.target) === 5))
}
