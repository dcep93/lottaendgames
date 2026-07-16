import type { Chess } from 'chess.js'
import { MATE_CATALOG } from './catalog'
import {
  getChess,
  SQUARE_TRANSFORMS,
  transformFen,
  validateMatePosition,
} from './chess'
import { isSupportedTwoKnightsPawnStart } from './positions'
import type { MateTerminalOutcome } from './session'
import type { MateId, MateMode } from './types'

export type MateFenDecodeResult =
  | { readonly ok: true; readonly fen: string }
  | { readonly ok: false }

export type MateShareTextInput = {
  readonly outcome: MateTerminalOutcome
  readonly elapsedMs: number
  readonly href: string
}

const INVALID_MATE_FEN = Object.freeze({ ok: false } as const)

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
  return `#fen=${encodeURIComponent(fen)}`
}

export function decodeMateFen(
  hash: string,
  mateId: MateId,
  mode: MateMode = 'standard',
): MateFenDecodeResult {
  if (!hash.startsWith('#fen=')) return INVALID_MATE_FEN

  const encodedFen = hash.slice('#fen='.length)
  if (encodedFen === '') return INVALID_MATE_FEN

  let decodedFen: string
  try {
    decodedFen = decodeURIComponent(encodedFen)
  } catch {
    return INVALID_MATE_FEN
  }
  const fields = decodedFen.trim().split(/\s+/)
  if (fields.length !== 6) {
    return INVALID_MATE_FEN
  }
  const halfmove = canonicalFenCounter(fields[4] ?? '', 0)
  const fullmove = canonicalFenCounter(fields[5] ?? '', 1)
  if (halfmove === null || fullmove === null) return INVALID_MATE_FEN
  fields[4] = halfmove
  fields[5] = fullmove

  let chess: Chess
  let fen: string
  try {
    chess = getChess(fields.join(' '))
    fen = chess.fen()
  } catch {
    return INVALID_MATE_FEN
  }
  if (!castlingRightsMatchPosition(chess, fields[2] ?? '')) {
    return INVALID_MATE_FEN
  }

  if (!validateMatePosition(mateId, fen).ok) {
    return INVALID_MATE_FEN
  }
  if (!isSupportedExactMateStart(mateId, mode, fen)) {
    return INVALID_MATE_FEN
  }

  return { ok: true, fen }
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
