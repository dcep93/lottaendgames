import assert from 'node:assert/strict'
import twoKnightsPawnPositions from './data/two-knights-pawn-positions.json'
import { MATE_CATALOG, TWO_KNIGHTS_PAWN_POSITIONS } from './catalog'
import { parseTwoKnightsPawnManifest } from './twoKnightsPawnData'

type Assert<T extends true> = T

export type KNNTrainSeedsAreReadonly = Assert<
  'push' extends keyof (typeof MATE_CATALOG)[4]['trainSeeds'] ? false : true
>

const expectedCatalog = [
  {
    id: 'queen',
    label: 'Queen',
    materialSignature: 'KQvK',
    path: '/mate/queen',
    standardFallbackFen: '8/8/8/8/4k3/8/8/3QK3 w - - 0 1',
    trainSeeds: ['8/8/8/8/3k4/1Q6/8/3K4 w - - 0 1'],
  },
  {
    id: 'rook',
    label: 'Rook',
    materialSignature: 'KRvK',
    path: '/mate/rook',
    standardFallbackFen: '8/8/8/8/4k3/8/8/R3K3 w - - 0 1',
    trainSeeds: ['8/8/8/8/3k4/8/1R6/3K4 w - - 0 1'],
  },
  {
    id: 'two-bishops',
    label: 'Two Bishops',
    materialSignature: 'KBBvK',
    path: '/mate/two-bishops',
    standardFallbackFen: '4k3/8/8/8/8/8/8/2B1KB2 w - - 0 1',
    trainSeeds: [
      '4k3/8/4K3/3BB3/8/8/8/8 w - - 38 20',
      '5k2/8/5K2/4BB2/8/8/8/8 w - - 38 20',
    ],
  },
  {
    id: 'bishop-knight',
    label: 'Bishop and Knight',
    materialSignature: 'KBNvK',
    path: '/mate/bishop-knight',
    standardFallbackFen: '8/8/8/3k4/8/8/8/4KBN1 w - - 0 1',
    trainSeeds: ['7k/8/5K2/6N1/4B3/8/8/8 w - - 42 22'],
  },
  {
    id: 'two-knights-pawn',
    label: 'Two Knights vs Pawn',
    materialSignature: 'KNNvKP',
    path: '/mate/two-knights-pawn',
    standardFallbackFen: '4k3/p7/8/8/8/8/8/1N2K1N1 w - - 0 1',
    trainSeeds: ['7k/8/5NKN/8/8/8/p7/8 w - - 0 1'],
  },
] as const

assert.deepEqual(MATE_CATALOG, expectedCatalog)

const ids = MATE_CATALOG.map(({ id }) => id)
const paths = MATE_CATALOG.map(({ path }) => path)

assert.equal(new Set(ids).size, MATE_CATALOG.length)
assert.equal(new Set(paths).size, MATE_CATALOG.length)

for (const record of MATE_CATALOG) {
  assert.ok(record.standardFallbackFen)
  assert.ok(record.trainSeeds.length > 0)
}

assert.deepEqual(TWO_KNIGHTS_PAWN_POSITIONS, twoKnightsPawnPositions)
assert.equal(Object.isFrozen(TWO_KNIGHTS_PAWN_POSITIONS), true)
assert.equal(Object.isFrozen(TWO_KNIGHTS_PAWN_POSITIONS.standard), true)
assert.equal(Object.isFrozen(TWO_KNIGHTS_PAWN_POSITIONS.provenance), true)
assert.equal(Object.isFrozen(TWO_KNIGHTS_PAWN_POSITIONS.standard[0]), true)
assert.equal(
  Object.isFrozen(TWO_KNIGHTS_PAWN_POSITIONS.standard[0]?.transformNames),
  true,
)

const validManifest = structuredClone(twoKnightsPawnPositions) as Record<
  string,
  unknown
>

for (const [label, mutate, expected] of [
  [
    'bad provenance',
    (manifest: any) => { manifest.provenance.provider = 'unknown' },
    /provenance.provider must be Lichess tablebase API/,
  ],
  [
    'empty standard',
    (manifest: any) => { manifest.standard = [] },
    /standard must be a non-empty array/,
  ],
  [
    'empty train',
    (manifest: any) => { manifest.train = [] },
    /train must be a non-empty array/,
  ],
  [
    'cursed win',
    (manifest: any) => { manifest.syzygy.requiredProbe = 1 },
    /unconditional win value 2/,
  ],
  [
    'undeclared transform',
    (manifest: any) => {
      manifest.standard[0].transformNames = ['identity', 'rotate90']
    },
    /not an allowed pawn-preserving transform/,
  ],
  [
    'duplicate transform',
    (manifest: any) => {
      manifest.standard[0].transformNames = ['identity', 'identity']
    },
    /must not contain duplicates/,
  ],
  [
    'extra metadata',
    (manifest: any) => { manifest.syzygy.url = 'https://example.test' },
    /syzygy must contain exactly/,
  ],
] as const) {
  const manifest = structuredClone(validManifest)
  mutate(manifest)
  assert.throws(() => parseTwoKnightsPawnManifest(manifest), expected, label)
}

console.log('mate catalog tests passed')
