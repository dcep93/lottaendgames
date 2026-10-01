import type {Square} from 'chess.js';
import {getEndgamePiecePlacements, SQUARE_TRANSFORMS, transformSquare} from '../chess';
import data from './bishopKnightStageData.json';
import {optimalBishopKnightBridge} from './bishopKnightOptimalBridge';

export type BishopKnightStage = 0 | 1 | 2;
export const r1Start = data.r1Start;
export const r2Starts: readonly string[] = data.r2Starts;
type Route = {stage: 1 | 2; remaining: number; destinations: readonly string[]};
const r1Routes = new Map<string, Route & {moves: string[]}>();
const reflect = (key: string, transform: typeof SQUARE_TRANSFORMS[number]) =>
  (key.match(/../g)! as Square[]).map(square => transformSquare(square, transform)).join('');
const bounds = new Map(data.sources.map(row => [row[0] as string, row[2] as number]));
for (const row of data.r1Edges) {
  const [source, destinations] = row as [string, string[]];
  for (const transform of SQUARE_TRANSFORMS) {
    const from = reflect(source, transform);
    const to = destinations.map(key => reflect(key, transform));
    const moves = to.map(destination => {
      const index = [0, 2, 4].find(i => from.slice(i, i + 2) !== destination.slice(i, i + 2))!;
      return from.slice(index, index + 2) + destination.slice(index, index + 2);
    });
    r1Routes.set(from, {stage: 1, remaining: bounds.get(source)!, destinations: to, moves});
  }
}

/** Strict KBN-v-K identity; never apply a four-piece certificate to extra material. */
export function bishopKnightPositionKey(fen: string): string | undefined {
  const pieces = getEndgamePiecePlacements(fen);
  if (pieces.length !== 4) return undefined;
  const ordered = ([['w', 'k'], ['w', 'b'], ['w', 'n'], ['b', 'k']] as const)
    .map(([color, piece]) => pieces.find(p => p.color === color && p.type === piece)?.square);
  return ordered.every(Boolean) ? ordered.join('') : undefined;
}

export function bishopKnightStagePosition(fen: string): Readonly<Route> | undefined {
  if (fen.split(' ')[1] !== 'w') return undefined;
  const key = bishopKnightPositionKey(fen);
  if (!key) return undefined;
  const net = r1Routes.get(key);
  if (net) return net;
  const bridge = optimalBishopKnightBridge(key);
  return bridge ? {stage: 2, remaining: bridge.remaining, destinations: bridge.destinations} : undefined;
}

/** Exact r1 reachable edges, then globally optimal r2 source/move edges. */
export function bishopKnightStageMoves(fen: string): {stage: BishopKnightStage; moves: readonly string[]} {
  if (fen.split(' ')[1] !== 'w') return {stage: 0, moves: []};
  const key = bishopKnightPositionKey(fen);
  if (!key) return {stage: 0, moves: []};
  const net = r1Routes.get(key);
  if (net) return {stage: 1, moves: net.moves};
  const bridge = optimalBishopKnightBridge(key);
  return bridge ? {stage: 2, moves: bridge.moves} : {stage: 0, moves: []};
}
