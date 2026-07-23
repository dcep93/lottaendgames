import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  getChess,
  squareCoordinates,
} from '../chess'
import { TWO_BISHOPS_PROOF_DATA_BASE64 } from './twoBishopsProofData'

const CANONICAL_BLACK_KING_SQUARES = [0, 1, 2, 3, 9, 10, 11, 18, 19, 27]
const CANONICAL_BLACK_KING_INDEX = new Map(
  CANONICAL_BLACK_KING_SQUARES.map((square, index) => [square, index]),
)
const ODD_PARITY_SQUARES = Array.from({ length: 64 }, (_, square) => square)
  .filter((square) => {
    const file = square % 8
    const rank = Math.floor(square / 8)
    return (file + rank) % 2 === 1
  })
const EVEN_PARITY_SQUARES = Array.from({ length: 64 }, (_, square) => square)
  .filter((square) => {
    const file = square % 8
    const rank = Math.floor(square / 8)
    return (file + rank) % 2 === 0
  })
const ODD_PARITY_INDEX = new Map(
  ODD_PARITY_SQUARES.map((square, index) => [square, index]),
)
const EVEN_PARITY_INDEX = new Map(
  EVEN_PARITY_SQUARES.map((square, index) => [square, index]),
)

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

const TWO_BISHOPS_PROOF_DATA = decodeBase64(
  TWO_BISHOPS_PROOF_DATA_BASE64,
)
const PROOF_DISTANCE_CACHE = new Map<string, number | null>()

function squareNumber(square: Square): number {
  const { file, rank } = squareCoordinates(square)
  return rank * 8 + file
}

function transformSquareNumber(square: number, transformIndex: number): number {
  const file = square % 8
  const rank = Math.floor(square / 8)
  const transformed = SQUARE_TRANSFORMS[transformIndex].map(file, rank)
  return transformed.rank * 8 + transformed.file
}

function compareTuple(first: readonly number[], second: readonly number[]): number {
  for (let index = 0; index < first.length; index += 1) {
    if (first[index] !== second[index]) return first[index] - second[index]
  }
  return 0
}

function canonicalCoordinates(
  blackKing: number,
  whiteKing: number,
  bishops: readonly number[],
): readonly [number, number, number, number] | null {
  if (bishops.length !== 2) return null
  let best: readonly [number, number, number, number] | null = null
  for (let transformIndex = 0; transformIndex < SQUARE_TRANSFORMS.length; transformIndex += 1) {
    const transformedBlackKing = transformSquareNumber(
      blackKing,
      transformIndex,
    )
    const transformedWhiteKing = transformSquareNumber(
      whiteKing,
      transformIndex,
    )
    const transformedBishops = bishops.map((square) =>
      transformSquareNumber(square, transformIndex),
    )
    const oddBishop = transformedBishops.find((square) => square % 2 !== Math.floor(square / 8) % 2)
    const evenBishop = transformedBishops.find((square) => square % 2 === Math.floor(square / 8) % 2)
    if (oddBishop === undefined || evenBishop === undefined) continue
    const candidate = [
      transformedBlackKing,
      transformedWhiteKing,
      oddBishop,
      evenBishop,
    ] as const
    if (best === null || compareTuple(candidate, best) < 0) best = candidate
  }
  return best
}

/**
 * Exact distance-to-mate for a legal White-to-move KBB-v-K position.
 *
 * The bundled table was generated offline from the Gaviota four-piece
 * tablebase. Lookup is deterministic, position-only, and makes no request.
 */
export function getTwoBishopsProofDistance(fen: string): number | null {
  const [boardFen, turn] = fen.split(' ')
  if (!boardFen || turn !== 'w') return null
  const cached = PROOF_DISTANCE_CACHE.get(boardFen)
  if (cached !== undefined || PROOF_DISTANCE_CACHE.has(boardFen)) return cached!
  const chess = getChess(fen)
  const pieces = chess.board().flat().filter((piece) => piece !== null)
  const blackKing = pieces.find(
    (piece) => piece.color === 'b' && piece.type === 'k',
  )
  const whiteKing = pieces.find(
    (piece) => piece.color === 'w' && piece.type === 'k',
  )
  const bishops = pieces
    .filter((piece) => piece.color === 'w' && piece.type === 'b')
    .map((piece) => piece.square)
  if (!blackKing || !whiteKing || bishops.length !== 2) {
    PROOF_DISTANCE_CACHE.set(boardFen, null)
    return null
  }

  const canonical = canonicalCoordinates(
    squareNumber(blackKing.square),
    squareNumber(whiteKing.square),
    bishops.map(squareNumber),
  )
  if (canonical === null) {
    PROOF_DISTANCE_CACHE.set(boardFen, null)
    return null
  }
  const [canonicalBlackKing, canonicalWhiteKing, oddBishop, evenBishop] =
    canonical
  const blackIndex = CANONICAL_BLACK_KING_INDEX.get(canonicalBlackKing)
  const oddIndex = ODD_PARITY_INDEX.get(oddBishop)
  const evenIndex = EVEN_PARITY_INDEX.get(evenBishop)
  if (
    blackIndex === undefined ||
    oddIndex === undefined ||
    evenIndex === undefined
  ) {
    PROOF_DISTANCE_CACHE.set(boardFen, null)
    return null
  }
  const offset =
    ((blackIndex * 64 + canonicalWhiteKing) * 32 + oddIndex) * 32 +
    evenIndex
  const distance = TWO_BISHOPS_PROOF_DATA[offset]
  const result = distance > 0 ? distance : null
  PROOF_DISTANCE_CACHE.set(boardFen, result)
  return result
}

export function isTwoBishopsProofProgress({
  currentDistance,
  worstReplyDistance,
  supportedCornerWait,
  startingBishopDistance,
  resultingBishopDistance,
}: {
  readonly currentDistance: number | null
  readonly worstReplyDistance: number
  readonly supportedCornerWait: boolean
  readonly startingBishopDistance: number
  readonly resultingBishopDistance: number
}): boolean {
  if (currentDistance === null) return false
  if (worstReplyDistance < currentDistance) return true
  return (
    worstReplyDistance === currentDistance &&
    supportedCornerWait &&
    startingBishopDistance <= 3 &&
    resultingBishopDistance > 3
  )
}
