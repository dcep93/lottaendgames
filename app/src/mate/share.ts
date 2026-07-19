import type { Chess } from 'chess.js'
import { MATE_CATALOG } from './catalog'
import {
  getEndgamePiecePlacements,
  getChess,
  materialMatchesMate,
  SQUARE_TRANSFORMS,
  transformFen,
  validateMatePosition,
} from './chess'
import { isSupportedTwoKnightsPawnStart } from './positions'
import {
  getMateTerminalOutcome,
  type MateTerminalOutcome,
} from './session'
import type { MateId, MateMode } from './types'

export type MateFenDecodeResult =
  | { readonly ok: true; readonly fen: string }
  | { readonly ok: false }

export type MateReplayDecodeResult =
  | {
      readonly ok: true
      readonly fen: string
      readonly moves: readonly string[] | null
    }
  | { readonly ok: false }

export type MateShareTextInput = {
  readonly outcome: MateTerminalOutcome
  readonly elapsedMs: number
  readonly href: string
}

const INVALID_MATE_FEN = Object.freeze({ ok: false } as const)
const INVALID_MATE_REPLAY = Object.freeze({ ok: false } as const)

export const MATE_REPLAY_MAX_PLIES = 512

const OUTCOME_LABELS: Readonly<Record<MateTerminalOutcome, string>> = {
  checkmate: 'checkmate',
  stalemate: 'stalemate',
  'lost-material': 'defeated',
  'lost-knight': 'defeated',
  'pawn-promoted': 'defeated',
  'fifty-move': 'draw',
  unsupported: 'defeated',
}

const trainStartsByMateId = new Map<MateId, ReadonlySet<string>>()

const CASTLING_REQUIREMENTS = {
  K: [
    { square: 'e1', color: 'w', type: 'k' },
    { square: 'h1', color: 'w', type: 'r' },
  ],
  Q: [
    { square: 'e1', color: 'w', type: 'k' },
    { square: 'a1', color: 'w', type: 'r' },
  ],
  k: [
    { square: 'e8', color: 'b', type: 'k' },
    { square: 'h8', color: 'b', type: 'r' },
  ],
  q: [
    { square: 'e8', color: 'b', type: 'k' },
    { square: 'a8', color: 'b', type: 'r' },
  ],
} as const

type CastlingRight = keyof typeof CASTLING_REQUIREMENTS

export function encodeMateFen(fen: string): string {
  return `#fen=${fen.trim().replace(/\s+/g, '_')}`
}

export function encodeMateLiveFen(fen: string): string {
  return `#live=${fen.trim().replace(/\s+/g, '_')}`
}

export function encodeMateReplay(
  fen: string,
  moves: readonly string[],
): string {
  if (moves.length === 0 || moves.length > MATE_REPLAY_MAX_PLIES) {
    throw new RangeError(
      `Mate replay requires 1-${MATE_REPLAY_MAX_PLIES} plies`,
    )
  }
  return `${encodeMateFen(fen)}&moves=${moves.map(encodeURIComponent).join(',')}`
}

export function decodeMateReplay(
  hash: string,
  mateId: MateId,
  mode: MateMode = 'standard',
): MateReplayDecodeResult {
  if (!hash.startsWith('#fen=')) return INVALID_MATE_REPLAY
  const parts = hash.slice(1).split('&')
  if (parts.length > 2 || parts[0]?.startsWith('fen=') !== true) {
    return INVALID_MATE_REPLAY
  }
  const fenResult = decodeMateFen(`#${parts[0]}`, mateId, mode)
  if (!fenResult.ok) return INVALID_MATE_REPLAY
  if (parts.length === 1) {
    return { ok: true, fen: fenResult.fen, moves: null }
  }

  const movesField = parts[1]
  if (movesField?.startsWith('moves=') !== true) {
    return INVALID_MATE_REPLAY
  }
  const encodedMoves = movesField.slice('moves='.length)
  if (encodedMoves === '') return INVALID_MATE_REPLAY

  let decodedMoves: string
  try {
    decodedMoves = decodeURIComponent(encodedMoves)
  } catch {
    return INVALID_MATE_REPLAY
  }
  const moves = decodedMoves.includes(',')
    ? decodedMoves.split(',')
    : decodedMoves.trim() === decodedMoves
      ? decodedMoves.split(/\s+/)
      : []
  if (
    moves.length === 0 ||
    moves.some((move) => move === '' || /\s/.test(move)) ||
    moves.length > MATE_REPLAY_MAX_PLIES ||
    moves.length % 2 !== 0
  ) {
    return INVALID_MATE_REPLAY
  }

  const chess = getChess(fenResult.fen)
  const canonicalMoves: string[] = []
  for (const san of moves) {
    if (getMateTerminalOutcome(mateId, chess.fen()) !== undefined) {
      return INVALID_MATE_REPLAY
    }
    try {
      const move = chess.move(san)
      if (move === null) return INVALID_MATE_REPLAY
      canonicalMoves.push(move.san)
    } catch {
      return INVALID_MATE_REPLAY
    }
  }
  if (chess.turn() !== 'w') return INVALID_MATE_REPLAY

  return {
    ok: true,
    fen: fenResult.fen,
    moves: Object.freeze(canonicalMoves),
  }
}

export function decodeMateFen(
  hash: string,
  mateId: MateId,
  mode: MateMode = 'standard',
): MateFenDecodeResult {
  const fen = decodeCanonicalFen(hash, '#fen=')
  if (fen === null) return INVALID_MATE_FEN

  if (!validateMatePosition(mateId, fen).ok) {
    return INVALID_MATE_FEN
  }
  if (!isSupportedExactMateStart(mateId, mode, fen)) {
    return INVALID_MATE_FEN
  }

  return { ok: true, fen }
}

export function decodeMateLiveFen(
  hash: string,
  mateId: MateId,
): MateFenDecodeResult {
  const fen = decodeCanonicalFen(hash, '#live=')
  if (fen === null) return INVALID_MATE_FEN

  if (validateMatePosition(mateId, fen).ok) {
    return { ok: true, fen }
  }
  try {
    const outcome = getMateTerminalOutcome(mateId, fen)
    return outcome !== undefined && isPlausibleLiveMaterial(mateId, fen)
      ? { ok: true, fen }
      : INVALID_MATE_FEN
  } catch {
    return INVALID_MATE_FEN
  }
}

function isPlausibleLiveMaterial(mateId: MateId, fen: string): boolean {
  if (materialMatchesMate(mateId, fen)) return true

  const entry = MATE_CATALOG.find(({ id }) => id === mateId)
  if (entry === undefined) return false
  const expected = pieceCounts(entry.standardFallbackFen)
  const actual = pieceCounts(fen)
  if (
    actual.get('w:k') !== 1 ||
    actual.get('b:k') !== 1
  ) {
    return false
  }
  const onlyExpectedCaptures = [...actual].every(
    ([piece, count]) => count <= (expected.get(piece) ?? 0),
  )
  if (onlyExpectedCaptures) return true
  if (mateId !== 'two-knights-pawn') return false

  const placements = getEndgamePiecePlacements(fen)
  const promotedBlackPieces = placements.filter(
    ({ color, type }) =>
      color === 'b' && type !== 'k' && type !== 'p',
  )
  return (
    promotedBlackPieces.length === 1 &&
    placements.every(({ color, type }) =>
      color === 'w'
        ? type === 'k' || type === 'n'
        : type === 'k' || type === promotedBlackPieces[0]?.type,
    )
  )
}

function pieceCounts(fen: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const { color, type } of getEndgamePiecePlacements(fen)) {
    const key = `${color}:${type}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

function decodeCanonicalFen(
  hash: string,
  prefix: '#fen=' | '#live=',
): string | null {
  if (!hash.startsWith(prefix)) return null

  const encodedFen = hash.slice(prefix.length)
  if (encodedFen === '') return null

  let decodedFen: string
  try {
    decodedFen = decodeURIComponent(encodedFen)
  } catch {
    return null
  }
  if (!/\s/.test(decodedFen)) decodedFen = decodedFen.replaceAll('_', ' ')
  const fields = decodedFen.trim().split(/\s+/)
  if (fields.length !== 6) {
    return null
  }
  const halfmove = canonicalFenCounter(fields[4] ?? '', 0)
  const fullmove = canonicalFenCounter(fields[5] ?? '', 1)
  if (halfmove === null || fullmove === null) return null
  fields[4] = halfmove
  fields[5] = fullmove

  let chess: Chess
  let fen: string
  try {
    chess = getChess(fields.join(' '))
    fen = chess.fen()
  } catch {
    return null
  }
  if (!castlingRightsMatchPosition(chess, fields[2] ?? '')) {
    return null
  }
  return fen
}

export function formatMateShareText({
  outcome,
  elapsedMs,
  href,
}: MateShareTextInput): string {
  return `${OUTCOME_LABELS[outcome]} in ${formatShareElapsed(elapsedMs)}\n${href}`
}

function isSupportedExactMateStart(
  mateId: MateId,
  mode: MateMode,
  fen: string,
): boolean {
  if (mateId === 'two-knights-pawn') {
    return isSupportedTwoKnightsPawnStart(fen, mode)
  }
  if (mode === 'standard') return true
  return getTrainStarts(mateId).has(fen)
}

function canonicalFenCounter(value: string, minimum: number): string | null {
  if (!/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= minimum
    ? String(parsed)
    : null
}

function castlingRightsMatchPosition(
  chess: Chess,
  castling: string,
): boolean {
  if (
    castling === '' ||
    !/^(?:-|K?Q?k?q?)$/.test(castling)
  ) {
    return false
  }
  if (castling === '-') return true

  return Array.from(castling).every((right) => {
    const requirements = CASTLING_REQUIREMENTS[right as CastlingRight]
    return requirements?.every(({ square, color, type }) => {
      const piece = chess.get(square)
      return piece?.color === color && piece.type === type
    }) === true
  })
}

function getTrainStarts(mateId: MateId): ReadonlySet<string> {
  const cached = trainStartsByMateId.get(mateId)
  if (cached !== undefined) return cached

  const entry = MATE_CATALOG.find((candidate) => candidate.id === mateId)
  if (entry === undefined) return new Set()

  const starts = new Set(
    entry.trainSeeds.flatMap((seed) =>
      SQUARE_TRANSFORMS.map((transform) =>
        getChess(transformFen(seed, transform)).fen(),
      ),
    ),
  )
  trainStartsByMateId.set(mateId, starts)
  return starts
}

function formatShareElapsed(elapsedMs: number): string {
  const safeMs = Number.isFinite(elapsedMs)
    ? Math.max(0, Math.floor(elapsedMs))
    : 0
  const totalCentiseconds = Math.floor(safeMs / 10)
  const minutes = Math.floor(totalCentiseconds / 6_000)
  const seconds = Math.floor((totalCentiseconds % 6_000) / 100)
  const centiseconds = totalCentiseconds % 100
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
}
