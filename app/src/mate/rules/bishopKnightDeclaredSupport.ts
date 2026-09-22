import type { Square } from 'chess.js'
import { SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'

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


const KING_BISHOP_SUPPORT_WITH_ANY_KNIGHT = SQUARE_TRANSFORMS.map(transform => ({
  king: transformSquare('b5', transform),
  bishop: transformSquare('a6', transform),
  black: transformSquare('a7', transform),
}))

/** The explicit Kb5 declaration is independent of every knight-placement restriction. */
export function isDeclaredCornerSupportWithAnyKnight(king: Square, bishop: Square, black: Square): boolean {
  return KING_BISHOP_SUPPORT_WITH_ANY_KNIGHT.some(placement =>
    placement.king === king && placement.bishop === bishop && placement.black === black)
}
