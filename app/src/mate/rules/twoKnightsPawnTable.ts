import type { Square } from 'chess.js'
import { getEndgamePiecePlacements } from '../chess'
import data from './twoKnightsPawnTableData.json'

const SIZE = 6 * 64 * 2016 * 64
const index = (s: string) => s.charCodeAt(0) - 97 + 8 * (Number(s[1]) - 1)
const square = (s: number) =>
  ('abcdefgh'[s % 8]! + String(1 + (s >> 3))) as Square
let table: DataView | undefined
let pending: Promise<void> | undefined
const promotions = new Map(
  data.promotions.map((row) => [row[0]!, row.slice(1)]),
)
export type TwoKnightsPawnEntry = {
  stage: 1 | 2 | 3
  distance: number
  plies: number
  from: Square
  to: Square
}
export const twoKnightsPawnTableReady = () => table !== undefined
export function installTwoKnightsPawnTable(bytes: ArrayBuffer) {
  if (bytes.byteLength !== data.bytes)
    throw new Error('Invalid h-pawn lookup size')
  table = new DataView(bytes)
}
export function loadTwoKnightsPawnTable(
  fetcher: typeof fetch = fetch,
): Promise<void> {
  if (table) return Promise.resolve()
  return (pending ??= (async () => {
    const base =
      (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env
        ?.BASE_URL ?? '/'
    const response = await fetcher(base + data.url.slice(1))
    if (!response.ok || !response.body)
      throw new Error('Could not load h-pawn lookup')
    const bytes = await new Response(
      response.body.pipeThrough(new DecompressionStream('gzip')),
    ).arrayBuffer()
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    const sha = Array.from(new Uint8Array(digest), (n) =>
      n.toString(16).padStart(2, '0'),
    ).join('')
    if (sha !== data.sha256) throw new Error('Invalid h-pawn lookup checksum')
    installTwoKnightsPawnTable(bytes)
  })().catch((error) => {
    pending = undefined
    throw error
  }))
}
function record(key: number): number | undefined {
  if (!table) return undefined
  let lo = 0,
    hi = data.records
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    const id = table.getUint32(mid * 8, true)
    if (id < key) lo = mid + 1
    else hi = mid
  }
  return lo < data.records && table.getUint32(lo * 8, true) === key
    ? table.getUint32(lo * 8 + 4, true)
    : undefined
}
/** No board reflection: a-file pawns and altered material are outside the method. */
export function twoKnightsPawnEntry(
  fen: string,
): TwoKnightsPawnEntry | undefined {
  if (!table) return undefined
  const pieces = getEndgamePiecePlacements(fen)
  if (pieces.length !== 5) return undefined
  const w = pieces.find((p) => p.color === 'w' && p.type === 'k'),
    k = pieces.find((p) => p.color === 'b' && p.type === 'k')
  const ns = pieces
    .filter((p) => p.color === 'w' && p.type === 'n')
    .map((p) => index(p.square))
    .sort((a, b) => a - b)
  const pawn = pieces.find((p) => p.color === 'b' && p.type !== 'k')
  if (!w || !k || ns.length !== 2 || !pawn) return undefined
  const pair = (ns[0]! * (127 - ns[0]!)) / 2 + ns[1]! - ns[0]! - 1
  const lower = (index(w.square) * 2016 + pair) * 64 + index(k.square)
  const black = fen.split(' ')[1] === 'b'
  let word: number | undefined
  if (
    pawn.type === 'p' &&
    pawn.square[0] === 'h' &&
    Number(pawn.square[1]) >= 2 &&
    Number(pawn.square[1]) <= 7
  ) {
    word = record(
      (Number(pawn.square[1]) - 2) * 64 * 2016 * 64 +
        lower +
        (black ? SIZE : 0),
    )
  } else if (!black && pawn.square === 'h1') {
    const type = 'qrbn'.indexOf(pawn.type),
      move = type >= 0 ? promotions.get(lower)?.[type] : undefined
    if (move !== undefined) word = move | (1 << 12) | (1 << 14) | (1 << 22)
  }
  if (word === undefined) return undefined
  return {
    stage: ((word >>> 12) & 3) as 1 | 2 | 3,
    distance: (word >>> 14) & 255,
    plies: word >>> 22,
    from: square((word >>> 6) & 63),
    to: square(word & 63),
  }
}
