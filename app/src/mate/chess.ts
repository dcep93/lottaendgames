import {
  Chess,
  type Color,
  type PieceSymbol,
  type Square,
} from 'chess.js'
import { MATE_CATALOG } from './catalog'
import type { MateId } from './types'

export type EndgamePiece = {
  readonly color: Color
  readonly type: PieceSymbol
  readonly isPawn: boolean
}

export type EndgamePiecePlacement = EndgamePiece & {
  readonly square: Square
}

export type SquareCoordinates = {
  readonly file: number
  readonly rank: number
}

export type SquareTransformName =
  | 'identity'
  | 'rotate90'
  | 'rotate180'
  | 'rotate270'
  | 'mirrorFile'
  | 'mirrorRank'
  | 'diagonal'
  | 'antiDiagonal'

export type SquareTransform = {
  readonly name: SquareTransformName
  readonly inverseName: SquareTransformName
  readonly map: (file: number, rank: number) => SquareCoordinates
}

export type MatePositionValidation =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string }

export const SQUARE_TRANSFORMS: readonly SquareTransform[] = [
  {
    name: 'identity',
    inverseName: 'identity',
    map: (file, rank) => ({ file, rank }),
  },
  {
    name: 'rotate90',
    inverseName: 'rotate270',
    map: (file, rank) => ({ file: 7 - rank, rank: file }),
  },
  {
    name: 'rotate180',
    inverseName: 'rotate180',
    map: (file, rank) => ({ file: 7 - file, rank: 7 - rank }),
  },
  {
    name: 'rotate270',
    inverseName: 'rotate90',
    map: (file, rank) => ({ file: rank, rank: 7 - file }),
  },
  {
    name: 'mirrorFile',
    inverseName: 'mirrorFile',
    map: (file, rank) => ({ file: 7 - file, rank }),
  },
  {
    name: 'mirrorRank',
    inverseName: 'mirrorRank',
    map: (file, rank) => ({ file, rank: 7 - rank }),
  },
  {
    name: 'diagonal',
    inverseName: 'diagonal',
    map: (file, rank) => ({ file: rank, rank: file }),
  },
  {
    name: 'antiDiagonal',
    inverseName: 'antiDiagonal',
    map: (file, rank) => ({ file: 7 - rank, rank: 7 - file }),
  },
]

const PIECE_ORDER: Readonly<Record<PieceSymbol, number>> = {
  k: 0,
  q: 1,
  r: 2,
  b: 3,
  n: 4,
  p: 5,
}

export function getChess(fen?: string): Chess {
  return fen === undefined ? new Chess() : new Chess(fen)
}

export function getEndgamePieces(fen: string): EndgamePiece[] {
  const pieces: EndgamePiece[] = []
  for (const rank of getChess(fen).board()) {
    for (const piece of rank) {
      if (piece === null) continue
      pieces.push({
        color: piece.color,
        type: piece.type,
        isPawn: piece.type === 'p',
      })
    }
  }
  return pieces
}

export function getEndgamePiecePlacements(
  fen: string,
): EndgamePiecePlacement[] {
  const placements: EndgamePiecePlacement[] = []
  for (const rank of getChess(fen).board()) {
    for (const piece of rank) {
      if (piece === null) continue
      placements.push({
        color: piece.color,
        type: piece.type,
        isPawn: piece.type === 'p',
        square: piece.square,
      })
    }
  }
  return placements
}

export function boardFenFromPlacements(
  placements: readonly EndgamePiecePlacement[],
): string {
  const pieceBySquare = new Map<Square, string>()
  for (const piece of placements) {
    pieceBySquare.set(
      piece.square,
      piece.color === 'w' ? piece.type.toUpperCase() : piece.type,
    )
  }

  return Array.from({ length: 8 }, (_, rankIndex) => {
    const rank = 8 - rankIndex
    let emptySquares = 0
    let row = ''
    for (let file = 0; file < 8; file += 1) {
      const square = squareFromCoordinates(file, rank - 1)
      if (square === null) continue
      const piece = pieceBySquare.get(square)
      if (piece === undefined) {
        emptySquares += 1
        continue
      }
      if (emptySquares > 0) {
        row += emptySquares
        emptySquares = 0
      }
      row += piece
    }
    return row + (emptySquares > 0 ? emptySquares : '')
  }).join('/')
}

export function squareCoordinates(square: Square): SquareCoordinates {
  return {
    file: square.charCodeAt(0) - 'a'.charCodeAt(0),
    rank: Number(square[1]) - 1,
  }
}

export const squareCoords = squareCoordinates

export function squareFromCoordinates(
  file: number,
  rank: number,
): Square | null {
  if (
    !Number.isInteger(file) ||
    !Number.isInteger(rank) ||
    file < 0 ||
    file > 7 ||
    rank < 0 ||
    rank > 7
  ) {
    return null
  }
  return `${String.fromCharCode('a'.charCodeAt(0) + file)}${rank + 1}` as Square
}

export const squareFromCoords = squareFromCoordinates

export function transformSquare(
  square: Square,
  transform: SquareTransform,
): Square {
  const { file, rank } = squareCoordinates(square)
  const transformed = transform.map(file, rank)
  const result = squareFromCoordinates(transformed.file, transformed.rank)
  if (result === null) {
    throw new Error(`invalid transformed square: ${square}`)
  }
  return result
}

export function getSquareTransform(name: string): SquareTransform {
  const transform = SQUARE_TRANSFORMS.find(
    (candidate) => candidate.name === name,
  )
  if (transform === undefined) {
    throw new Error(`unknown square transform: ${name}`)
  }
  return transform
}

export function transformFen(fen: string, transform: SquareTransform): string {
  const [
    ,
    turn = 'w',
    castling = '-',
    enPassant = '-',
    halfmove = '0',
    fullmove = '1',
  ] = fen.trim().split(/\s+/)
  const board = boardFenFromPlacements(
    getEndgamePiecePlacements(fen).map((piece) => ({
      ...piece,
      square: transformSquare(piece.square, transform),
    })),
  )
  return `${board} ${turn} ${castling} ${enPassant} ${halfmove} ${fullmove}`
}

export function randomTransformFen(
  fen: string,
  random: () => number = Math.random,
): string {
  const index = collectionIndex(SQUARE_TRANSFORMS.length, random())
  return transformFen(fen, SQUARE_TRANSFORMS[index])
}

export function collectionIndex(length: number, randomValue: number): number {
  if (!Number.isInteger(length) || length <= 0) {
    throw new RangeError(
      `Collection length must be a positive integer; received ${String(length)}`,
    )
  }
  if (
    !Number.isFinite(randomValue) ||
    randomValue < 0 ||
    randomValue >= 1
  ) {
    throw new RangeError(
      `Random value must be finite and within [0, 1); received ${String(randomValue)}`,
    )
  }
  return Math.floor(randomValue * length)
}

export function allSquares(): Square[] {
  return Array.from({ length: 8 }, (_, file) =>
    Array.from({ length: 8 }, (_, rank) => {
      const square = squareFromCoordinates(file, rank)
      if (square === null) {
        throw new Error(`invalid square coordinates: ${file}, ${rank}`)
      }
      return square
    }),
  ).flat()
}

export function squareColor(square: Square): 0 | 1 {
  const { file, rank } = squareCoordinates(square)
  return ((file + rank) % 2) as 0 | 1
}

export function kingDistance(first: Square, second: Square): number {
  const a = squareCoordinates(first)
  const b = squareCoordinates(second)
  return Math.max(Math.abs(a.file - b.file), Math.abs(a.rank - b.rank))
}

export const kingWalkDistance = kingDistance

export function manhattanDistance(first: Square, second: Square): number {
  const a = squareCoordinates(first)
  const b = squareCoordinates(second)
  return Math.abs(a.file - b.file) + Math.abs(a.rank - b.rank)
}

export function squaredEuclideanDistance(
  first: Square,
  second: Square,
): number {
  const a = squareCoordinates(first)
  const b = squareCoordinates(second)
  const fileDelta = a.file - b.file
  const rankDelta = a.rank - b.rank
  return fileDelta * fileDelta + rankDelta * rankDelta
}

export function whiteBishopsAreOppositeColored(
  placements: readonly EndgamePiecePlacement[],
): boolean {
  const bishopSquares = placements
    .filter((piece) => piece.color === 'w' && piece.type === 'b')
    .map((piece) => piece.square)
  return (
    bishopSquares.length === 2 &&
    squareColor(bishopSquares[0]) !== squareColor(bishopSquares[1])
  )
}

export function isLegalEndgameStart(fen: string): boolean {
  try {
    const whiteToMove = getChess(fen)
    if (
      whiteToMove.turn() !== 'w' ||
      whiteToMove.isCheck() ||
      whiteToMove.moves().length === 0 ||
      whiteToMove.isGameOver()
    ) {
      return false
    }

    const fields = fen.trim().split(/\s+/)
    fields[1] = 'b'
    fields[3] = '-'
    const blackToMove = getChess(fields.join(' '))
    return (
      !blackToMove.isCheck() &&
      blackToMove.moves().length > 0 &&
      !blackToMove.isGameOver()
    )
  } catch {
    return false
  }
}

export function pieceSignature(fen: string): string
export function pieceSignature(pieces: readonly EndgamePiece[]): string
export function pieceSignature(
  source: string | readonly EndgamePiece[],
): string {
  const pieces = typeof source === 'string' ? getEndgamePieces(source) : source
  return [...pieces]
    .sort((first, second) => {
      if (first.color !== second.color) {
        return first.color === 'w' ? -1 : 1
      }
      return PIECE_ORDER[first.type] - PIECE_ORDER[second.type]
    })
    .map((piece) => `${piece.color}:${piece.type}`)
    .join(',')
}

export function materialMatchesMate(mateId: MateId, fen: string): boolean {
  try {
    const catalogEntry = getCatalogEntry(mateId)
    return (
      pieceSignature(fen) === pieceSignature(catalogEntry.standardFallbackFen)
    )
  } catch {
    return false
  }
}

export function validateMatePosition(
  mateId: MateId,
  fen: string,
): MatePositionValidation {
  if (mateId === 'two-knights-pawn' && fenHasPawnOnEdgeRank(fen)) {
    return { ok: false, reason: 'Pawns cannot be placed on ranks 1 or 8' }
  }

  let chess: Chess
  try {
    chess = getChess(fen)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    return { ok: false, reason: `Invalid FEN: ${reason}` }
  }

  if (chess.turn() !== 'w') {
    return { ok: false, reason: 'White must be to move' }
  }
  if (!materialMatchesMate(mateId, fen)) {
    return { ok: false, reason: `Material does not match ${mateId}` }
  }

  const placements = getEndgamePiecePlacements(fen)
  if (
    mateId === 'two-bishops' &&
    !whiteBishopsAreOppositeColored(placements)
  ) {
    return {
      ok: false,
      reason: 'White bishops must be on opposite-colored squares',
    }
  }
  if (
    mateId === 'two-knights-pawn' &&
    placements.some(
      (piece) =>
        piece.type === 'p' &&
        (piece.square[1] === '1' || piece.square[1] === '8'),
    )
  ) {
    return { ok: false, reason: 'Pawns cannot be placed on ranks 1 or 8' }
  }
  if (!isLegalEndgameStart(fen)) {
    return {
      ok: false,
      reason: 'Position is not a legal non-terminal endgame start',
    }
  }
  return { ok: true }
}

function getCatalogEntry(mateId: MateId) {
  const entry = MATE_CATALOG.find((candidate) => candidate.id === mateId)
  if (entry === undefined) {
    throw new Error(`Unknown mate set: ${mateId}`)
  }
  return entry
}

function fenHasPawnOnEdgeRank(fen: string): boolean {
  const [board = ''] = fen.trim().split(/\s+/)
  const ranks = board.split('/')
  return (
    ranks.length === 8 &&
    (/[pP]/.test(ranks[0]) || /[pP]/.test(ranks[ranks.length - 1]))
  )
}
