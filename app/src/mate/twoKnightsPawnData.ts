export const TWO_KNIGHTS_PAWN_TRANSFORM_NAMES = ['identity'] as const
export type TwoKnightsPawnTransformName = 'identity'
export type TwoKnightsPawnSource = {
  readonly fen: string
  readonly transformNames: readonly TwoKnightsPawnTransformName[]
}
export type TwoKnightsPawnManifest = {
  readonly standard: readonly TwoKnightsPawnSource[]
  readonly train: readonly TwoKnightsPawnSource[]
}

/** Starts are h-pawn positions; file reflections would change the supported domain. */
export function parseTwoKnightsPawnManifest(
  value: unknown,
): TwoKnightsPawnManifest {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid h-pawn starts')
  const manifest = value as Record<string, unknown>
  if (Object.keys(manifest).sort().join(',') !== 'standard,train') {
    throw new Error('h-pawn starts must contain exactly standard and train')
  }
  const sources = (mode: 'standard' | 'train') => {
    const rows = manifest[mode]
    if (!Array.isArray(rows) || rows.length === 0)
      throw new Error(`${mode} must be a non-empty array`)
    return Object.freeze(
      rows.map((row: TwoKnightsPawnSource) => {
        if (
          !row ||
          typeof row.fen !== 'string' ||
          Object.keys(row).sort().join(',') !== 'fen,transformNames' ||
          !Array.isArray(row.transformNames) ||
          row.transformNames.length !== 1 ||
          row.transformNames[0] !== 'identity'
        )
          throw new Error('Only the identity h-pawn transform is supported')
        return Object.freeze({
          fen: row.fen,
          transformNames: Object.freeze(['identity'] as const),
        })
      }),
    )
  }
  return Object.freeze({
    standard: sources('standard'),
    train: sources('train'),
  })
}
