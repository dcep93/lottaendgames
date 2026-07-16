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
  if (
    fields.length !== 6 ||
    !/^(?:0|[1-9]\d*)$/.test(fields[4] ?? '') ||
    !/^[1-9]\d*$/.test(fields[5] ?? '')
  ) {
    return INVALID_MATE_FEN
  }

  let fen: string
  try {
    fen = getChess(fields.join(' ')).fen()
  } catch {
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
