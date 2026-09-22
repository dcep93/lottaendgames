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


const SUPPORT_WITHOUT_KNIGHT_TARGET = [
  {king: 'b5', bishop: 'a6', black: 'a7'}, // Any knight location, explicitly declared.
  {king: 'b5', bishop: 'a6', black: 'a8', knight: 'f6'}, // Result after 2. Nf6.
] as const
const SUPPORT_WITHOUT_KNIGHT_TARGET_REFLECTIONS = SUPPORT_WITHOUT_KNIGHT_TARGET.flatMap(placement =>
  SQUARE_TRANSFORMS.map(transform => ({
    king: transformSquare(placement.king, transform),
    bishop: transformSquare(placement.bishop, transform),
    black: transformSquare(placement.black, transform),
    knight: 'knight' in placement ? transformSquare(placement.knight, transform) : undefined,
  })))

/** Explicit support declarations do not create a knight target at Kb5. */
export function isDeclaredCornerSupportWithoutKnightTarget(king: Square, bishop: Square, black: Square, knight: Square): boolean {
  return SUPPORT_WITHOUT_KNIGHT_TARGET_REFLECTIONS.some(placement =>
    placement.king === king && placement.bishop === bishop && placement.black === black &&
    (placement.knight === undefined || placement.knight === knight))
}

const KING_PROTECTED_EDGE_BISHOP = SQUARE_TRANSFORMS.map(transform => ({
  king: transformSquare('b6', transform),
  bishop: transformSquare('a6', transform),
}))

/** Ba6/Kb6 is explicitly supported regardless of Black and the knight. */
export function isDeclaredUnconditionalThreeSupport(king: Square, bishop: Square): boolean {
  return KING_PROTECTED_EDGE_BISHOP.some(placement => placement.king === king && placement.bishop === bishop)
}
