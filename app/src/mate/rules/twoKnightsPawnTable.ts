import data from './twoKnightsPawnTableData.json'
import { TWO_KNIGHTS_PAWN_SLOTS, twoKnightsPawnPositionId } from './twoKnightsPawnMoves'
export { twoKnightsPawnPositionId } from './twoKnightsPawnMoves'

export type TwoKnightsPawnEntry = { status: 'win'; plies: number } | { status: 'no-forced-mate'; plies: null }
const metadata = data as unknown as { url: string; rawbytes: number; sha256raw: string; records: number }
const HEADER_BYTES = 32
const BLOCK_BYTES = 256
const POPCOUNT = Uint8Array.from({ length: 256 }, (_, n) => {
  let count = 0
  for (; n; n &= n - 1) count++
  return count
})
let table: { bitmap: Uint8Array; values: DataView; prefix: Uint32Array } | undefined
let pending: Promise<void> | undefined
export const twoKnightsPawnTableReady = () => table !== undefined
export function installTwoKnightsPawnTable(bytes: ArrayBuffer) {
  const view = new DataView(bytes)
  if (bytes.byteLength < HEADER_BYTES || new TextDecoder().decode(new Uint8Array(bytes, 0, 8)) !== 'KNNHDTM1' ||
      view.getUint32(8, true) !== TWO_KNIGHTS_PAWN_SLOTS || view.getUint32(20, true) !== 1)
    throw new Error('Invalid two-knights tablebase header')
  const records = view.getUint32(12, true), bitmapBytes = view.getUint32(16, true)
  if (bitmapBytes !== TWO_KNIGHTS_PAWN_SLOTS / 8 || bytes.byteLength !== HEADER_BYTES + bitmapBytes + records * 2)
    throw new Error('Invalid two-knights tablebase size')
  const bitmap = new Uint8Array(bytes, HEADER_BYTES, bitmapBytes)
  const prefix = new Uint32Array(Math.ceil(bitmapBytes / BLOCK_BYTES) + 1)
  let total = 0
  for (let i = 0; i < bitmapBytes; i++) {
    if (i % BLOCK_BYTES === 0) prefix[i / BLOCK_BYTES] = total
    total += POPCOUNT[bitmap[i]!]!
  }
  prefix[prefix.length - 1] = total
  if (total !== records) throw new Error('Invalid two-knights tablebase record count')
  const values = new DataView(bytes, HEADER_BYTES + bitmapBytes, records * 2)
  for (let i = 0; i < records; i++) {
    if (values.getUint16(i * 2, true) === 65535) throw new Error('Invalid two-knights tablebase value')
  }
  table = { bitmap, values, prefix }
}
export function loadTwoKnightsPawnTable(fetcher: typeof fetch = fetch): Promise<void> {
  if (table) return Promise.resolve()
  return pending ??= (async () => {
    const base = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'
    const response = await fetcher(base + metadata.url.slice(1))
    if (response.status === 404) throw new Error('Two-knights tablebase data is missing (404)')
    if (!response.ok || !response.body) throw new Error('Could not load two-knights tablebase')
    const downloaded = await response.arrayBuffer()
    const header = new Uint8Array(downloaded, 0, Math.min(2, downloaded.byteLength))
    const bytes = header[0] === 0x1f && header[1] === 0x8b
      ? await new Response(new Blob([downloaded]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
      : downloaded
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    const sha = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('')
    if (sha !== metadata.sha256raw) throw new Error('Invalid two-knights tablebase checksum')
    if (bytes.byteLength !== metadata.rawbytes) throw new Error('Invalid two-knights tablebase size')
    installTwoKnightsPawnTable(bytes)
  })().catch(error => { pending = undefined; throw error })
}
export function twoKnightsPawnEntry(fen: string): TwoKnightsPawnEntry | undefined {
  const id = twoKnightsPawnPositionId(fen)
  if (!table || id === undefined) return undefined
  const byte = Math.floor(id / 8), bit = id % 8
  const mask = table.bitmap[byte]!
  if ((mask & (1 << bit)) === 0) return undefined
  const block = Math.floor(byte / BLOCK_BYTES)
  let rank = table.prefix[block]!
  for (let i = block * BLOCK_BYTES; i < byte; i++) rank += POPCOUNT[table.bitmap[i]!]!
  rank += POPCOUNT[mask & ((1 << bit) - 1)]!
  const plies = table.values.getUint16(rank * 2, true)
  return plies === 65534 ? { status: 'no-forced-mate', plies: null } : { status: 'win', plies }
}
