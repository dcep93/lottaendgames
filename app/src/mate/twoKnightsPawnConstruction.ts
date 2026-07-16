import constructionJson from './data/two-knights-pawn-construction.json'
import { TWO_KNIGHTS_PAWN_POSITIONS } from './catalog'
import {
  getChess,
  getSquareTransform,
  transformFen,
} from './chess'
import type { MateMode } from './types'
import type { TwoKnightsPawnTransformName } from './twoKnightsPawnData'

export type TwoKnightsPawnConstructionEntry = {
  readonly san: string
}

export type TwoKnightsPawnConstructionRoute = {
  readonly mode: MateMode
  readonly sourceIndex: number
  readonly transformName: TwoKnightsPawnTransformName
  readonly plies: readonly Readonly<{
    san: string
  }>[]
}

type ConstructionData = {
  readonly metadata: {
    readonly generator: 'scripts/generate_two_knights_pawn_construction.mts'
    readonly algorithm: 'bounded-adversarial-witness-replay-v1'
    readonly discovery: 'deterministic-offline-beam-search'
    readonly whiteEdgeAuditProvider: 'Lichess tablebase API'
    readonly whiteEdgeAuditVerifiedOn: '2026-07-16'
    readonly whiteEdgeRequiredWdl: 2
    readonly beamWidth: 10000
    readonly maximumWhiteMoves: 95
    readonly maximumPlies: 200
    readonly policySha256: string
  }
  readonly routes: readonly TwoKnightsPawnConstructionRoute[]
}

function assertRecord(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${label} must contain exactly: ${expected.join(', ')}`)
  }
}

export function twoKnightsPawnConstructionKey(fen: string): string {
  const [board, turn] = getChess(fen).fen().split(' ')
  return `${board} ${turn}`
}

function parseTwoKnightsPawnConstructionWithEntries(
  value: unknown,
): {
  readonly data: ConstructionData
  readonly entries: ReadonlyMap<string, TwoKnightsPawnConstructionEntry>
  readonly positions: ReadonlySet<string>
} {
  assertRecord(value, 'construction')
  assertExactKeys(value, ['metadata', 'routes'], 'construction')
  assertRecord(value.metadata, 'construction.metadata')
  assertExactKeys(
    value.metadata,
    [
      'generator',
      'algorithm',
      'discovery',
      'whiteEdgeAuditProvider',
      'whiteEdgeAuditVerifiedOn',
      'whiteEdgeRequiredWdl',
      'beamWidth',
      'maximumWhiteMoves',
      'maximumPlies',
      'policySha256',
    ],
    'construction.metadata',
  )
  const metadata = {
    generator: 'scripts/generate_two_knights_pawn_construction.mts',
    algorithm: 'bounded-adversarial-witness-replay-v1',
    discovery: 'deterministic-offline-beam-search',
    whiteEdgeAuditProvider: 'Lichess tablebase API',
    whiteEdgeAuditVerifiedOn: '2026-07-16',
    whiteEdgeRequiredWdl: 2,
    beamWidth: 10000,
    maximumWhiteMoves: 95,
    maximumPlies: 200,
  } as const
  for (const [key, expected] of Object.entries(metadata)) {
    if (value.metadata[key] !== expected) {
      throw new Error(`construction.metadata.${key} must be ${String(expected)}`)
    }
  }
  if (
    typeof value.metadata.policySha256 !== 'string' ||
    !/^[0-9a-f]{64}$/.test(value.metadata.policySha256)
  ) {
    throw new Error('construction.metadata.policySha256 must be a SHA-256 hex digest')
  }
  if (!Array.isArray(value.routes) || value.routes.length === 0) {
    throw new Error('construction.routes must be a non-empty array')
  }

  const entries = new Map<string, TwoKnightsPawnConstructionEntry>()
  const positions = new Set<string>()
  const routeKeys = new Set<string>()
  const routes = value.routes.map((routeValue, routeIndex) => {
    const label = `construction.routes[${routeIndex}]`
    assertRecord(routeValue, label)
    assertExactKeys(
      routeValue,
      ['mode', 'sourceIndex', 'transformName', 'plies'],
      label,
    )
    if (routeValue.mode !== 'standard' && routeValue.mode !== 'train') {
      throw new Error(`${label}.mode must be standard or train`)
    }
    if (!Number.isInteger(routeValue.sourceIndex) || Number(routeValue.sourceIndex) < 0) {
      throw new Error(`${label}.sourceIndex must be a non-negative integer`)
    }
    const mode = routeValue.mode
    const sourceIndex = Number(routeValue.sourceIndex)
    const source = TWO_KNIGHTS_PAWN_POSITIONS[mode][sourceIndex]
    if (!source) throw new Error(`${label} references a missing source`)
    if (
      typeof routeValue.transformName !== 'string' ||
      !source.transformNames.includes(
        routeValue.transformName as TwoKnightsPawnTransformName,
      )
    ) {
      throw new Error(`${label}.transformName is not declared by its source`)
    }
    const transformName =
      routeValue.transformName as TwoKnightsPawnTransformName
    const routeKey = `${mode}:${sourceIndex}:${transformName}`
    if (routeKeys.has(routeKey)) throw new Error(`${label} duplicates ${routeKey}`)
    routeKeys.add(routeKey)
    if (!Array.isArray(routeValue.plies) || routeValue.plies.length === 0) {
      throw new Error(`${label}.plies must be a non-empty array`)
    }
    if (routeValue.plies.length > metadata.maximumPlies) {
      throw new Error(`${label} exceeds the construction ply bound`)
    }
    if (Math.ceil(routeValue.plies.length / 2) > metadata.maximumWhiteMoves) {
      throw new Error(`${label} exceeds the White-move search bound`)
    }
    const routePlyCount = routeValue.plies.length

    const chess = getChess(
      transformFen(source.fen, getSquareTransform(transformName)),
    )
    const seen = new Set([twoKnightsPawnConstructionKey(chess.fen())])
    positions.add(twoKnightsPawnConstructionKey(chess.fen()))
    const plies = routeValue.plies.map((plyValue, plyIndex) => {
      const plyLabel = `${label}.plies[${plyIndex}]`
      assertRecord(plyValue, plyLabel)
      const whiteTurn = chess.turn() === 'w'
      assertExactKeys(plyValue, ['san'], plyLabel)
      if (typeof plyValue.san !== 'string' || plyValue.san === '') {
        throw new Error(`${plyLabel}.san must be a non-empty string`)
      }
      if (whiteTurn) {
        const key = twoKnightsPawnConstructionKey(chess.fen())
        const existing = entries.get(key)
        if (existing && existing.san !== plyValue.san) {
          throw new Error(`${plyLabel} conflicts with another route at ${key}`)
        }
        entries.set(key, Object.freeze({ san: plyValue.san }))
      }
      if (!chess.moves().includes(plyValue.san)) {
        throw new Error(`${plyLabel}.san is not legal from the route position`)
      }
      chess.move(plyValue.san)
      if (plyIndex < routePlyCount - 1 && chess.isGameOver()) {
        throw new Error(`${plyLabel} ends the route before its final ply`)
      }
      const key = twoKnightsPawnConstructionKey(chess.fen())
      if (seen.has(key)) throw new Error(`${plyLabel} repeats ${key}`)
      seen.add(key)
      positions.add(key)
      return Object.freeze({ san: plyValue.san })
    })
    if (!chess.isCheckmate() || chess.turn() !== 'b') {
      throw new Error(`${label} must finish with Black checkmated`)
    }
    return Object.freeze({
      mode,
      sourceIndex,
      transformName,
      plies: Object.freeze(plies),
    })
  })

  for (const [mode, sources] of [
    ['standard', TWO_KNIGHTS_PAWN_POSITIONS.standard],
    ['train', TWO_KNIGHTS_PAWN_POSITIONS.train],
  ] as const) {
    for (const [sourceIndex, source] of sources.entries()) {
      for (const transformName of source.transformNames) {
        const key = `${mode}:${sourceIndex}:${transformName}`
        if (!routeKeys.has(key)) throw new Error(`construction route missing ${key}`)
      }
    }
  }

  return Object.freeze({
    data: Object.freeze({
      metadata: Object.freeze({
        ...metadata,
        policySha256: value.metadata.policySha256,
      }),
      routes: Object.freeze(routes),
    }),
    entries: new Map(entries),
    positions: new Set(positions),
  })
}

export function parseTwoKnightsPawnConstruction(
  value: unknown,
): ConstructionData {
  return parseTwoKnightsPawnConstructionWithEntries(value).data
}

const committedConstruction =
  parseTwoKnightsPawnConstructionWithEntries(constructionJson)

export const TWO_KNIGHTS_PAWN_CONSTRUCTION = committedConstruction.data

const parsedEntries = committedConstruction.entries
const parsedPositions = committedConstruction.positions

export function getTwoKnightsPawnConstructionEntry(
  fen: string,
): TwoKnightsPawnConstructionEntry | undefined {
  return parsedEntries.get(twoKnightsPawnConstructionKey(fen))
}

export function isTwoKnightsPawnConstructionPosition(fen: string): boolean {
  try {
    return parsedPositions.has(twoKnightsPawnConstructionKey(fen))
  } catch {
    return false
  }
}
