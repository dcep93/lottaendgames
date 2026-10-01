import type {Square} from 'chess.js';
import {SQUARE_TRANSFORMS, transformSquare} from '../chess';
import data from './bishopKnightOptimalBridgeData.json';

const square = (n: number) => ('abcdefgh'[n & 7]! + ((n >> 3) + 1)) as Square;
const index = (s: string) => s.charCodeAt(0) - 97 + (Number(s[1]) - 1) * 8;
const transforms = SQUARE_TRANSFORMS.map(t => {
  const forward = Array.from({length: 64}, (_, i) => index(transformSquare(square(i), t)));
  const inverse: number[] = [];
  forward.forEach((to, from) => { inverse[to] = from; });
  return {forward, inverse};
});
const rows = new Map(data.rows.map(row => [row.key, row]));

/** Exact source lookup; only exported bridge sources qualify, never the whole board. */
export function optimalBishopKnightBridge(key: string) {
  const pieces = key.match(/../g)!.map(index);
  let canonical = Infinity;
  let orientation = transforms[0]!;
  for (const t of transforms) {
    const p = pieces.map(s => t.forward[s]!);
    const k = (p[0]! << 18) | (p[1]! << 12) | (p[2]! << 6) | p[3]!;
    if (k < canonical) { canonical = k; orientation = t; }
  }
  const row = rows.get(canonical);
  if (!row) return undefined;
  const moves = row.moves.map(move => square(orientation.inverse[move >> 6]!) + square(orientation.inverse[move & 63]!));
  const destinations = moves.map(move => key.match(/../g)!.map(s => s === move.slice(0, 2) ? move.slice(2) : s).join(''));
  return {moves, bridgeMoves: row.bridge, remaining: row.mate, destinations};
}
