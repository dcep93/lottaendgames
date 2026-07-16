import twoKnightsPawnPositions from './data/two-knights-pawn-positions.json'
import type { MateId } from './types'

export type MateCatalogRecord = {
  id: MateId
  label: string
  materialSignature: string
  path: `/mate/${MateId}`
  standardFallbackFen: string
  trainSeeds: readonly string[]
}

export const MATE_CATALOG = [
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
    standardFallbackFen: twoKnightsPawnPositions.standard[0].fen,
    trainSeeds: twoKnightsPawnPositions.train.map(({ fen }) => fen),
  },
] as const satisfies readonly MateCatalogRecord[]
