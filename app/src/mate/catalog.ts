import twoKnightsPawnPositions from './data/two-knights-pawn-positions.json'
import { parseTwoKnightsPawnManifest } from './twoKnightsPawnData'
import type { MateId } from './types'

export const TWO_KNIGHTS_PAWN_POSITIONS =
  parseTwoKnightsPawnManifest(twoKnightsPawnPositions)

export type MateCatalogEntry = {
  readonly id: MateId
  readonly label: string
  readonly materialSignature: string
  readonly path: `/mate/${MateId}`
  readonly standardFallbackFen: string
  readonly trainSeeds: readonly string[]
}

export const MATE_CATALOG: readonly MateCatalogEntry[] = [
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
    standardFallbackFen: TWO_KNIGHTS_PAWN_POSITIONS.standard[0]!.fen,
    trainSeeds: Object.freeze(
      TWO_KNIGHTS_PAWN_POSITIONS.train.map(({ fen }) => fen),
    ),
  },
]
