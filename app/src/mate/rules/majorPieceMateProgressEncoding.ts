import { getChess, getEndgamePiecePlacements, kingDistance } from '../chess'
import type { MateId } from '../types'

export type MajorPieceMateId = Extract<MateId, 'queen' | 'rook'>
export type MajorPieceMateProgressTurn = 'b' | 'w'

export type MajorPieceMateProgressState = {
  readonly blackKing: number
  readonly majorPiece: number
  readonly turn: MajorPieceMateProgressTurn
  readonly whiteKing: number
}

const BOARD_SQUARES = 64

export function encodeMajorPieceMateProgressState(
  state: MajorPieceMateProgressState,
): number {
  return (
    ((state.blackKing * BOARD_SQUARES + state.whiteKing) * BOARD_SQUARES +
      state.majorPiece) *
      2 +
    (state.turn === 'b' ? 1 : 0)
  )
}

export function decodeMajorPieceMateProgressState(
  key: number,
): MajorPieceMateProgressState {
  if (!Number.isSafeInteger(key) || key < 0 || key >= BOARD_SQUARES ** 3 * 2) {
    throw new Error(`Invalid major-piece mate-progress key ${String(key)}`)
  }
  const turn: MajorPieceMateProgressTurn = key % 2 === 1 ? 'b' : 'w'
  let placements = Math.floor(key / 2)
  const majorPiece = placements % BOARD_SQUARES
  placements = Math.floor(placements / BOARD_SQUARES)
  const whiteKing = placements % BOARD_SQUARES
  const blackKing = Math.floor(placements / BOARD_SQUARES)
  return { blackKing, majorPiece, turn, whiteKing }
}

export function canonicalMajorPieceMateProgressKey(
  state: MajorPieceMateProgressState,
): number {
  let canonical = Number.MAX_SAFE_INTEGER
  for (let transform = 0; transform < 8; transform += 1) {
    const candidate = encodeMajorPieceMateProgressState({
      blackKing: transformSquareIndex(state.blackKing, transform),
      majorPiece: transformSquareIndex(state.majorPiece, transform),
      turn: state.turn,
      whiteKing: transformSquareIndex(state.whiteKing, transform),
    })
    canonical = Math.min(canonical, candidate)
  }
  return canonical
}

export function majorPieceMateProgressStateFromFen(
  mateId: MajorPieceMateId,
  fen: string,
): MajorPieceMateProgressState | null {
  const fields = fen.trim().split(/\s+/)
  const turn = fields[1]
  if (
    fields.length !== 6 ||
    (turn !== 'w' && turn !== 'b') ||
    fields[2] !== '-' ||
    fields[3] !== '-'
  ) {
    return null
  }

  try {
    getChess(fen)
  } catch {
    return null
  }

  const placements = getEndgamePiecePlacements(fen)
  if (placements.length !== 3) return null
  const blackKings = placements.filter(
    (piece) => piece.color === 'b' && piece.type === 'k',
  )
  const whiteKings = placements.filter(
    (piece) => piece.color === 'w' && piece.type === 'k',
  )
  const majorPieces = placements.filter(
    (piece) =>
      piece.color === 'w' && piece.type === (mateId === 'queen' ? 'q' : 'r'),
  )
  if (
    blackKings.length !== 1 ||
    whiteKings.length !== 1 ||
    majorPieces.length !== 1
  ) {
    return null
  }

  const blackKing = blackKings[0]!
  const whiteKing = whiteKings[0]!
  if (kingDistance(blackKing.square, whiteKing.square) <= 1) return null

  if (turn === 'w') {
    const blackTurnFields = [...fields]
    blackTurnFields[1] = 'b'
    try {
      if (getChess(blackTurnFields.join(' ')).isCheck()) return null
    } catch {
      return null
    }
  }

  return {
    blackKing: squareIndex(blackKing.square),
    majorPiece: squareIndex(majorPieces[0]!.square),
    turn,
    whiteKing: squareIndex(whiteKing.square),
  }
}

export function squareIndex(square: string): number {
  if (!/^[a-h][1-8]$/.test(square)) {
    throw new Error(`Invalid square ${square}`)
  }
  return square.charCodeAt(0) - 97 + (Number(square[1]) - 1) * 8
}

export function squareFromIndex(index: number): string {
  if (!Number.isSafeInteger(index) || index < 0 || index >= BOARD_SQUARES) {
    throw new Error(`Invalid square index ${String(index)}`)
  }
  return `${String.fromCharCode(97 + (index % 8))}${Math.floor(index / 8) + 1}`
}

function transformSquareIndex(index: number, transform: number): number {
  const file = index % 8
  const rank = Math.floor(index / 8)
  let transformedFile: number
  let transformedRank: number
  switch (transform) {
    case 0:
      transformedFile = file
      transformedRank = rank
      break
    case 1:
      transformedFile = 7 - rank
      transformedRank = file
      break
    case 2:
      transformedFile = 7 - file
      transformedRank = 7 - rank
      break
    case 3:
      transformedFile = rank
      transformedRank = 7 - file
      break
    case 4:
      transformedFile = 7 - file
      transformedRank = rank
      break
    case 5:
      transformedFile = file
      transformedRank = 7 - rank
      break
    case 6:
      transformedFile = rank
      transformedRank = file
      break
    default:
      transformedFile = 7 - rank
      transformedRank = 7 - file
      break
  }
  return transformedFile + transformedRank * 8
}
