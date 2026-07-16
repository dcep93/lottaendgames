import type { Square } from 'chess.js'

export type BishopKnightLookupEntry = {
  readonly key: string
  readonly from: Square
  readonly to: Square
}

const RAW_BISHOP_KNIGHT_LOOKUP_ENTRIES = [
  {
    key: "8/8/5KNk/5B2/8/8/8/8 w",
    from: "f5",
    to: "g4",
  },
  {
    key: "7k/8/5K2/6N1/4B3/8/8/8 w",
    from: "g5",
    to: "f7",
  },
  {
    key: "6k1/5N2/5K2/8/4B3/8/8/8 w",
    from: "e4",
    to: "g6",
  },
  {
    key: "5k2/5N2/5KB1/8/8/8/8/8 w",
    from: "g6",
    to: "h7",
  },
  {
    key: "4k3/5N1B/5K2/8/8/8/8/8 w",
    from: "f7",
    to: "e5",
  },
  {
    key: "5k2/7B/5K2/4N3/8/8/8/8 w",
    from: "e5",
    to: "d7",
  },
  {
    key: "3k4/7B/5K2/4N3/8/8/8/8 w",
    from: "f6",
    to: "e6",
  },
  {
    key: "2k5/7B/4K3/4N3/8/8/8/8 w",
    from: "e5",
    to: "d7",
  },
  {
    key: "8/2kN3B/4K3/8/8/8/8/8 w",
    from: "h7",
    to: "e4",
  },
  {
    key: "2k5/3N3B/4K3/8/8/8/8/8 w",
    from: "h7",
    to: "e4",
  },
  {
    key: "4k3/7B/4K3/4N3/8/8/8/8 w",
    from: "e5",
    to: "d7",
  },
  {
    key: "8/2k4B/4K3/4N3/8/8/8/8 w",
    from: "e5",
    to: "d7",
  },
  {
    key: "8/1k1N3B/4K3/8/8/8/8/8 w",
    from: "h7",
    to: "d3",
  },
  {
    key: "k7/3N4/4K3/8/8/3B4/8/8 w",
    from: "e6",
    to: "d6",
  },
  {
    key: "8/1k1N4/3K4/8/8/3B4/8/8 w",
    from: "d3",
    to: "c4",
  },
  {
    key: "8/3N4/2k1K3/8/8/3B4/8/8 w",
    from: "d3",
    to: "c4",
  },
  {
    key: "8/1k1N4/4K3/8/2B5/8/8/8 w",
    from: "e6",
    to: "d6",
  },
  {
    key: "8/1k1N4/4K3/8/8/3B4/8/8 w",
    from: "e6",
    to: "d6",
  },
  {
    key: "2k5/3N4/3K4/8/8/3B4/8/8 w",
    from: "d3",
    to: "e4",
  },
  {
    key: "8/k2N4/3K4/8/2B5/8/8/8 w",
    from: "d6",
    to: "c7",
  },
  {
    key: "8/k2N4/4K3/8/8/3B4/8/8 w",
    from: "e6",
    to: "d6",
  },
  {
    key: "k7/3N4/3K4/8/8/3B4/8/8 w",
    from: "d6",
    to: "c6",
  },
  {
    key: "k7/3N4/2K5/8/8/3B4/8/8 w",
    from: "d3",
    to: "c4",
  },
  {
    key: "8/k2N4/2K5/8/8/3B4/8/8 w",
    from: "d3",
    to: "c4",
  },
  {
    key: "8/k2N4/3K4/8/8/3B4/8/8 w",
    from: "d6",
    to: "c7",
  },
  {
    key: "k7/2KN4/8/8/8/3B4/8/8 w",
    from: "d7",
    to: "c5",
  },
  {
    key: "8/k1K5/8/2N5/8/3B4/8/8 w",
    from: "d3",
    to: "f5",
  },
  {
    key: "k7/2K5/8/2N2B2/8/8/8/8 w",
    from: "c7",
    to: "b6",
  },
  {
    key: "1k6/8/1K6/2N2B2/8/8/8/8 w",
    from: "c5",
    to: "a6",
  },
  {
    key: "k7/8/NK6/5B2/8/8/8/8 w",
    from: "f5",
    to: "e4",
  },
  {
    key: "k7/3N4/2K5/8/2B5/8/8/8 w",
    from: "c6",
    to: "c7",
  },
  {
    key: "k7/3N4/3K4/8/2B5/8/8/8 w",
    from: "d6",
    to: "c7",
  },
  {
    key: "8/3N3B/2k1K3/8/8/8/8/8 w",
    from: "h7",
    to: "d3",
  },
  {
    key: "8/2kN4/4K3/8/8/3B4/8/8 w",
    from: "d3",
    to: "e4",
  },
  {
    key: "8/2kN4/4K3/8/2B5/8/8/8 w",
    from: "c4",
    to: "d5",
  },
  {
    key: "8/2kN4/4K3/8/4B3/8/8/8 w",
    from: "e4",
    to: "d5",
  },
  {
    key: "2k5/3N4/4K3/8/8/3B4/8/8 w",
    from: "d3",
    to: "e4",
  },
  {
    key: "3k4/3N4/4K3/8/4B3/8/8/8 w",
    from: "e6",
    to: "d6",
  },
  {
    key: "3k4/3N4/3K4/8/4B3/8/8/8 w",
    from: "e4",
    to: "g6",
  },
  {
    key: "4k3/3N4/3K4/8/4B3/8/8/8 w",
    from: "e4",
    to: "g6",
  },
  {
    key: "4k3/3N4/3K4/5B2/8/8/8/8 w",
    from: "f5",
    to: "g6",
  },
  {
    key: "2k5/3N4/3K4/5B2/8/8/8/8 w",
    from: "d7",
    to: "c5",
  },
  {
    key: "1k6/8/3K4/2N2B2/8/8/8/8 w",
    from: "d6",
    to: "c6",
  },
  {
    key: "8/k7/2K5/2N2B2/8/8/8/8 w",
    from: "f5",
    to: "e6",
  },
  {
    key: "k7/8/2K1B3/2N5/8/8/8/8 w",
    from: "c6",
    to: "b6",
  },
  {
    key: "2k5/3N4/4K3/8/4B3/8/8/8 w",
    from: "e6",
    to: "d6",
  },
  {
    key: "2k5/3N4/3K2B1/8/8/8/8/8 w",
    from: "d7",
    to: "c5",
  },
  {
    key: "3k4/8/3K2B1/2N5/8/8/8/8 w",
    from: "c5",
    to: "b7",
  },
  {
    key: "2k5/1N6/3K2B1/8/8/8/8/8 w",
    from: "d6",
    to: "c6",
  },
  {
    key: "1k6/1N6/2K3B1/8/8/8/8/8 w",
    from: "c6",
    to: "b6",
  },
  {
    key: "2k5/1N6/1K4B1/8/8/8/8/8 w",
    from: "g6",
    to: "f5",
  },
  {
    key: "2k5/3N4/3K4/8/4B3/8/8/8 w",
    from: "e4",
    to: "d5",
  },
  {
    key: "3k4/3N4/3K4/3B4/8/8/8/8 w",
    from: "d5",
    to: "f7",
  },
  {
    key: "2k5/3N4/3K4/3B4/8/8/8/8 w",
    from: "d5",
    to: "e4",
  },
  {
    key: "2k5/3N4/4K3/3B4/8/8/8/8 w",
    from: "e6",
    to: "d6",
  },
  {
    key: "3k4/3N4/4K3/3B4/8/8/8/8 w",
    from: "e6",
    to: "d6",
  },
  {
    key: "4k3/3N4/3K4/3B4/8/8/8/8 w",
    from: "d5",
    to: "e6",
  },
  {
    key: "5k2/B3N3/4K3/8/8/8/8/8 w",
    from: "e7",
    to: "f5",
  },
  {
    key: "7k/B7/5K2/5N2/8/8/8/8 w",
    from: "f6",
    to: "g6",
  },
  {
    key: "6k1/B7/6K1/5N2/8/8/8/8 w",
    from: "a7",
    to: "c5",
  },
  {
    key: "4k3/B7/4K3/5N2/8/8/8/8 w",
    from: "a7",
    to: "b6",
  },
  {
    key: "3k4/3N4/3KB3/8/8/8/8/8 w",
    from: "e6",
    to: "f7",
  },
  {
    key: "2k5/3N1B2/3K4/8/8/8/8/8 w",
    from: "d7",
    to: "c5",
  },
  {
    key: "1k6/7B/3K4/2N5/8/8/8/8 w",
    from: "d6",
    to: "c6",
  },
  {
    key: "8/k6B/2K5/2N5/8/8/8/8 w",
    from: "h7",
    to: "f5",
  },
  {
    key: "1k6/8/2K5/2N2B2/8/8/8/8 w",
    from: "c6",
    to: "b6",
  },
  {
    key: "2k5/7B/2K5/2N5/8/8/8/8 w",
    from: "c5",
    to: "b7",
  },
  {
    key: "1k6/1N5B/2K5/8/8/8/8/8 w",
    from: "c6",
    to: "b6",
  },
  {
    key: "2k5/1N5B/1K6/8/8/8/8/8 w",
    from: "h7",
    to: "f5",
  },
  {
    key: "1k6/1N6/1K6/5B2/8/8/8/8 w",
    from: "b7",
    to: "c5",
  },
  {
    key: "k7/8/1K6/2N2B2/8/8/8/8 w",
    from: "f5",
    to: "e6",
  },
  {
    key: "4k3/3N3B/5K2/8/8/8/8/8 w",
    from: "f6",
    to: "e6",
  },
  {
    key: "3k4/3N3B/4K3/8/8/8/8/8 w",
    from: "e6",
    to: "d6",
  },
  {
    key: "4k3/3N3B/3K4/8/8/8/8/8 w",
    from: "h7",
    to: "g6",
  },
  {
    key: "3k4/3N4/3K2B1/8/8/8/8/8 w",
    from: "d7",
    to: "c5",
  },
  {
    key: "2k5/3N4/3K4/8/2B5/8/8/8 w",
    from: "c4",
    to: "d5",
  },
  {
    key: "3k4/8/3K4/2N2B2/8/8/8/8 w",
    from: "f5",
    to: "g6",
  },
  {
    key: "1k6/8/2K5/2N5/2B5/8/8/8 w",
    from: "c4",
    to: "e6",
  },
  {
    key: "k7/8/2K5/2N2B2/8/8/8/8 w",
    from: "f5",
    to: "e6",
  },
  {
    key: "2k5/8/3K2B1/2N5/8/8/8/8 w",
    from: "g6",
    to: "f7",
  },
  {
    key: "3k4/5B2/3K4/2N5/8/8/8/8 w",
    from: "c5",
    to: "b7",
  },
  {
    key: "1k6/5B2/3K4/2N5/8/8/8/8 w",
    from: "f7",
    to: "e6",
  },
  {
    key: "8/k7/3KB3/2N5/8/8/8/8 w",
    from: "d6",
    to: "c7",
  },
  {
    key: "k7/2K5/4B3/2N5/8/8/8/8 w",
    from: "c7",
    to: "b6",
  },
  {
    key: "1k6/8/1K2B3/2N5/8/8/8/8 w",
    from: "c5",
    to: "a6",
  },
  {
    key: "k7/8/NK2B3/8/8/8/8/8 w",
    from: "e6",
    to: "d5",
  },
  {
    key: "k7/8/3KB3/2N5/8/8/8/8 w",
    from: "d6",
    to: "c6",
  },
  {
    key: "8/k7/2K1B3/2N5/8/8/8/8 w",
    from: "e6",
    to: "d7",
  },
  {
    key: "8/k7/2K5/2N5/2B5/8/8/8 w",
    from: "c5",
    to: "d7",
  },
  {
    key: "1k6/8/2K1B3/2N5/8/8/8/8 w",
    from: "c6",
    to: "b6",
  },
  {
    key: "1k6/3B4/2K5/2N5/8/8/8/8 w",
    from: "c6",
    to: "b6",
  },
  {
    key: "k7/3B4/2K5/2N5/8/8/8/8 w",
    from: "c6",
    to: "b6",
  },
  {
    key: "k7/3B4/1K6/2N5/8/8/8/8 w",
    from: "d7",
    to: "e6",
  },
  {
    key: "k7/8/2K3B1/2N5/8/8/8/8 w",
    from: "c6",
    to: "b6",
  },
  {
    key: "k7/8/2K1B3/1N6/8/8/8/8 w",
    from: "c6",
    to: "b6",
  },
  {
    key: "2k5/1N3B2/3K4/8/8/8/8/8 w",
    from: "d6",
    to: "c6",
  },
  {
    key: "1k6/1N3B2/2K5/8/8/8/8/8 w",
    from: "c6",
    to: "b6",
  },
  {
    key: "1k6/8/4B3/1NK5/8/8/8/8 w",
    from: "c5",
    to: "b6",
  },
  {
    key: "k7/8/1K2B3/1N6/8/8/8/8 w",
    from: "b5",
    to: "c7",
  },
  {
    key: "1k6/2N5/1K2B3/8/8/8/8/8 w",
    from: "c7",
    to: "a6",
  },
  {
    key: "8/8/8/8/2N5/3K2B1/8/1k6 w",
    from: "d3",
    to: "c3",
  },
  {
    key: "8/8/8/8/2N5/2K3B1/8/2k5 w",
    from: "c4",
    to: "b2",
  },
  {
    key: "8/8/8/8/8/1K4B1/1N6/k7 w",
    from: "b2",
    to: "c4",
  },
  {
    key: "8/8/8/8/2N5/1K4B1/8/1k6 w",
    from: "g3",
    to: "f4",
  },
  {
    key: "8/8/8/5B2/8/4K3/4N3/7k w",
    from: "e3",
    to: "f2",
  },
  {
    key: "8/8/8/5B2/8/8/4NK1k/8 w",
    from: "f5",
    to: "g4",
  },
  {
    key: "8/8/8/8/6B1/8/4NK2/7k w",
    from: "e2",
    to: "g3",
  },
  {
    key: "8/8/8/8/6B1/6N1/5K1k/8 w",
    from: "g3",
    to: "f1",
  },
  {
    key: "6k1/8/4NK2/8/8/8/5B2/8 w",
    from: "f6",
    to: "g6",
  },
  {
    key: "7k/8/4N1K1/8/8/8/5B2/8 w",
    from: "e6",
    to: "g5",
  },
  {
    key: "6k1/8/6K1/6N1/8/8/5B2/8 w",
    from: "f2",
    to: "c5",
  },
  {
    key: "k7/1N3B2/1K6/8/8/8/8/8 w",
    from: "f7",
    to: "e6",
  },
  {
    key: "k7/1NK5/8/8/8/8/8/1B6 w",
    from: "b7",
    to: "d6",
  },
  {
    key: "2k5/1N3B2/1K6/8/8/8/8/8 w",
    from: "f7",
    to: "e6",
  },
  {
    key: "1k6/1N6/1K2B3/8/8/8/8/8 w",
    from: "b7",
    to: "c5",
  },
  {
    key: "k7/8/1K2B3/2N5/8/8/8/8 w",
    from: "e6",
    to: "d7",
  },
  {
    key: "1k6/3B4/1K6/2N5/8/8/8/8 w",
    from: "c5",
    to: "a6",
  },
  {
    key: "k7/3B4/NK6/8/8/8/8/8 w",
    from: "d7",
    to: "c6",
  },
  {
    key: "6k1/2B5/6K1/5N2/8/8/8/8 w",
    from: "c7",
    to: "d6",
  },
] as const

export const BISHOP_KNIGHT_LOOKUP_ENTRIES: readonly BishopKnightLookupEntry[] =
  Object.freeze(
    RAW_BISHOP_KNIGHT_LOOKUP_ENTRIES.map((entry) =>
      Object.freeze({ ...entry }),
    ),
  )

export const BISHOP_KNIGHT_PREPARE_STARTS = Object.freeze([
  '8/4k3/4B3/4K3/1N6/8/8/8 w - - 0 1',
  '8/4k3/4B3/4K3/8/2N5/8/8 w - - 0 1',
  '8/4k3/4B3/4K3/8/1N6/8/8 w - - 0 1',
  '8/4k3/4B3/4K3/8/6N1/8/8 w - - 0 1',
  '8/4k3/4B3/4K3/8/7N/8/8 w - - 0 1',
] as const)
