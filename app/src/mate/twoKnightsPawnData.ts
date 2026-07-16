export const TWO_KNIGHTS_PAWN_TRANSFORM_NAMES = [
  'identity',
  'mirrorFile',
] as const

export type TwoKnightsPawnTransformName =
  (typeof TWO_KNIGHTS_PAWN_TRANSFORM_NAMES)[number]

export type TwoKnightsPawnSource = {
  readonly fen: string
  readonly dtm: number
  readonly dtz: number
  readonly transformNames: readonly TwoKnightsPawnTransformName[]
}

export type TwoKnightsPawnManifest = {
  readonly syzygy: {
    readonly format: 'five-piece'
    readonly classification: 'win'
    readonly requiredProbe: 2
  }
  readonly provenance: {
    readonly provider: 'Lichess tablebase API'
    readonly endpoint: 'https://tablebase.lichess.ovh/standard'
    readonly verifiedOn: '2026-07-16'
    readonly wdlMetric: 'Syzygy WDL'
    readonly dtzMetric: 'Syzygy DTZ'
    readonly dtmMetric: 'Lichess DTM record (not exposed by Syzygy)'
    readonly constructionMaximumPlies: 200
  }
  readonly standard: readonly TwoKnightsPawnSource[]
  readonly train: readonly TwoKnightsPawnSource[]
}

function assertPlainRecord(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort()
  const sortedExpected = [...expected].sort()
  if (
    actual.length !== sortedExpected.length ||
    actual.some((key, index) => key !== sortedExpected[index])
  ) {
    throw new Error(
      `${label} must contain exactly: ${sortedExpected.join(', ')}`,
    )
  }
}

function parseSource(
  value: unknown,
  label: string,
): TwoKnightsPawnSource {
  assertPlainRecord(value, label)
  assertExactKeys(value, ['fen', 'dtm', 'dtz', 'transformNames'], label)
  if (typeof value.fen !== 'string' || value.fen.trim() === '') {
    throw new Error(`${label}.fen must be a non-empty string`)
  }
  if (!Number.isInteger(value.dtm) || Number(value.dtm) <= 0) {
    throw new Error(`${label}.dtm must be a positive integer`)
  }
  if (!Number.isInteger(value.dtz) || Number(value.dtz) <= 0) {
    throw new Error(`${label}.dtz must be a positive integer`)
  }
  if (!Array.isArray(value.transformNames) || value.transformNames.length === 0) {
    throw new Error(`${label}.transformNames must be a non-empty array`)
  }
  const allowed = new Set<string>(TWO_KNIGHTS_PAWN_TRANSFORM_NAMES)
  const transformNames = value.transformNames.map((name, index) => {
    if (typeof name !== 'string' || !allowed.has(name)) {
      throw new Error(
        `${label}.transformNames[${index}] is not an allowed pawn-preserving transform`,
      )
    }
    return name as TwoKnightsPawnTransformName
  })
  if (new Set(transformNames).size !== transformNames.length) {
    throw new Error(`${label}.transformNames must not contain duplicates`)
  }
  return Object.freeze({
    fen: value.fen,
    dtm: Number(value.dtm),
    dtz: Number(value.dtz),
    transformNames: Object.freeze(transformNames),
  })
}

function parseSources(
  value: unknown,
  label: 'standard' | 'train',
): readonly TwoKnightsPawnSource[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must be a non-empty array`)
  }
  return Object.freeze(
    value.map((source, index) => parseSource(source, `${label}[${index}]`)),
  )
}

export function parseTwoKnightsPawnManifest(
  value: unknown,
): TwoKnightsPawnManifest {
  assertPlainRecord(value, 'manifest')
  assertExactKeys(
    value,
    ['syzygy', 'provenance', 'standard', 'train'],
    'manifest',
  )
  assertPlainRecord(value.syzygy, 'syzygy')
  assertExactKeys(
    value.syzygy,
    ['format', 'classification', 'requiredProbe'],
    'syzygy',
  )
  if (value.syzygy.format !== 'five-piece') {
    throw new Error('syzygy.format must be five-piece')
  }
  if (value.syzygy.classification !== 'win') {
    throw new Error('syzygy.classification must be win')
  }
  if (value.syzygy.requiredProbe !== 2) {
    throw new Error('syzygy.requiredProbe must be the unconditional win value 2')
  }
  assertPlainRecord(value.provenance, 'provenance')
  assertExactKeys(
    value.provenance,
    [
      'provider',
      'endpoint',
      'verifiedOn',
      'wdlMetric',
      'dtzMetric',
      'dtmMetric',
      'constructionMaximumPlies',
    ],
    'provenance',
  )
  const expectedProvenance = {
    provider: 'Lichess tablebase API',
    endpoint: 'https://tablebase.lichess.ovh/standard',
    verifiedOn: '2026-07-16',
    wdlMetric: 'Syzygy WDL',
    dtzMetric: 'Syzygy DTZ',
    dtmMetric: 'Lichess DTM record (not exposed by Syzygy)',
    constructionMaximumPlies: 200,
  } as const
  for (const [key, expected] of Object.entries(expectedProvenance)) {
    if (value.provenance[key] !== expected) {
      throw new Error(`provenance.${key} must be ${String(expected)}`)
    }
  }

  return Object.freeze({
    syzygy: Object.freeze({
      format: 'five-piece' as const,
      classification: 'win' as const,
      requiredProbe: 2 as const,
    }),
    provenance: Object.freeze(expectedProvenance),
    standard: parseSources(value.standard, 'standard'),
    train: parseSources(value.train, 'train'),
  })
}
