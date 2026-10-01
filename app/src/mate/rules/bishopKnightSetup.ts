import {getEndgamePiecePlacements} from '../chess';
import data from './bishopKnightSetupData.json';

const transforms = Array.from({length: 8}, (_, transform) =>
  Array.from({length: 64}, (_, square) => {
    const x = square & 7, y = square >> 3;
    const [file, rank] = [
      [x, y], [7-y, x], [7-x, 7-y], [y, 7-x],
      [7-x, y], [x, 7-y], [y, x], [7-y, 7-x],
    ][transform]!;
    return file! + 8 * rank!;
  }),
);
const inverse = transforms.map(transform => {
  const result: number[] = [];
  transform.forEach((to, from) => { result[to] = from; });
  return result;
});
// Canonical White kings occupy ten squares. Each slot contains 64^3 piece placements.
const slots = new Int8Array(64).fill(-1);
let slot = 0;
for (let square = 0; square < 64; square++) {
  if (transforms.every(transform => transform[square]! >= square)) slots[square] = slot++;
}
const index = (square: string) => square.charCodeAt(0)-97 + 8*(Number(square[1])-1);
const squareName = (square: number) => 'abcdefgh'[square & 7]! + String((square >> 3)+1);
let table: DataView | undefined;
let pending: Promise<void> | undefined;
export const bishopKnightSetupReady = () => table !== undefined;

/** Node verifiers install the same checked-in bytes; browser loading verifies SHA-256 first. */
export function installBishopKnightSetup(bytes: ArrayBuffer) {
  if (bytes.byteLength !== data.bytes) throw new Error('Invalid bishop-and-knight setup table size.');
  table = new DataView(bytes);
}

export function loadBishopKnightSetup(fetcher: typeof fetch = fetch): Promise<void> {
  if (table) return Promise.resolve();
  return pending ??= (async () => {
    const baseUrl = (import.meta as ImportMeta & {env?: {BASE_URL?: string}}).env?.BASE_URL ?? '/';
    const response = await fetcher(`${baseUrl}${data.url.slice(1)}`);
    if (!response.ok) throw new Error('Could not load bishop-and-knight recommendations.');
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    if (hash !== data.sha256) throw new Error('Invalid bishop-and-knight setup table checksum.');
    installBishopKnightSetup(bytes);
  })().catch(error => {
    pending = undefined;
    throw error;
  });
}

/** Fastest forced arrival at the central formation, independent of move counters. */
export function bishopKnightSetupMoves(fen: string): {moves: readonly string[]; distance: number} | undefined {
  if (!table || fen.split(' ')[1] !== 'w') return undefined;
  const pieces = getEndgamePiecePlacements(fen);
  if (pieces.length !== 4) return undefined;
  const squares = ([['w', 'k'], ['w', 'b'], ['w', 'n'], ['b', 'k']] as const)
    .map(([color, type]) => pieces.find(piece => piece.color === color && piece.type === type)?.square);
  if (squares.some(square => !square)) return undefined;
  const positions = squares.map(square => index(square!));
  const keys = transforms.map(transform =>
    (transform[positions[0]!]! << 18) | (transform[positions[1]!]! << 12)
      | (transform[positions[2]!]! << 6) | transform[positions[3]!]!,
  );
  const canonical = Math.min(...keys), kingSlot = slots[canonical >>> 18]!;
  if (kingSlot < 0) return undefined;
  const word = table.getUint16(((kingSlot << 18) | (canonical & 0x3ffff))*2, true);
  if (word === 65535 || word === 0) return undefined;
  const distance = word >>> 12, from = (word >>> 6) & 63, to = word & 63;
  // If a source is symmetric, retain every equivalent chosen edge.
  const moves = [...new Set(keys.flatMap((key, transform) => key === canonical
    ? [squareName(inverse[transform]![from]!) + squareName(inverse[transform]![to]!)] : []))];
  return {moves, distance};
}
