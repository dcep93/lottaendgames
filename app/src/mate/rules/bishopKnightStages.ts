import type {Square} from 'chess.js';
import {getChess, getEndgamePiecePlacements, SQUARE_TRANSFORMS, transformSquare} from '../chess';
import data from './bishopKnightStageData.json';

export type BishopKnightStage = 0 | 1 | 2;
export const r1Start = data.r1Start;
export const r2Starts: readonly string[] = data.r2Starts;
type Route = {stage: 1 | 2; remaining: number; destinations: readonly string[]};
type StoredRoute = Omit<Route, 'stage'> & {priority: 1 | 2};
const routes = new Map<string, StoredRoute>();
const r1Edges = new Map<string, readonly string[]>();
const arrivals = [new Map<string, number>(), new Map<string, number>()];
const bounds = new Map<string, number>();
const reflect = (key: string, transform: typeof SQUARE_TRANSFORMS[number]) =>
  (key.match(/../g)! as Square[]).map(square => transformSquare(square, transform)).join('');

for (const row of data.r1Edges) {
  const [source, destinations] = row as [string, string[]];
  for (const transform of SQUARE_TRANSFORMS) {
    r1Edges.set(reflect(source, transform), destinations.map(key => reflect(key, transform)));
  }
}

for (const [key, bound] of data.arrivals) for (const transform of SQUARE_TRANSFORMS) {
  bounds.set(reflect(key as string, transform), bound as number);
}

for (const row of data.sources) {
  // Priority preserves established choices; it does not assign a rule label.
  const [source, priority, remaining, destinations] = row as [string, 1 | 2, number, string[]];
  for (const transform of SQUARE_TRANSFORMS) {
    const reflected = destinations.map(key => reflect(key, transform));
    routes.set(reflect(source, transform), {priority, remaining, destinations: reflected});
    destinations.forEach((key, index) => {
      // Canonicalization of the bound is independent of the source orientation.
      const bound = bounds.get(key) ?? Infinity;
      if (!Number.isFinite(bound)) throw new Error(`Missing stage destination bound: ${key}`);
      arrivals[priority - 1]!.set(reflected[index]!, bound);
    });
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
  const key = bishopKnightPositionKey(fen) ?? '';
  const route = routes.get(key);
  return route ? {stage: r1Edges.has(key) ? 1 : 2, remaining: route.remaining, destinations: route.destinations} : undefined;
}

/** Recognize a whole resulting position, independent of the moving piece or history. */
export function bishopKnightStageMoves(fen: string): {stage: BishopKnightStage; moves: readonly string[]} {
  if (fen.split(' ')[1] !== 'w') return {stage: 0, moves: []};
  const key = bishopKnightPositionKey(fen);
  if (!key) return {stage: 0, moves: []};
  const route = routes.get(key);
  const legal = getChess(fen).moves({verbose: true});
  const candidates = legal.map(move => ({move, key: bishopKnightPositionKey(move.after)!}));
  const classify = (selected: typeof candidates): {stage: 1 | 2; moves: string[]} => ({
    stage: selected.length > 0 && selected.every(candidate => r1Edges.get(key)?.includes(candidate.key)) ? 1 : 2,
    moves: selected.map(({move}) => move.from + move.to),
  });
  for (const priority of [1, 2] as const) {
    // Preserve the exact established choices, including any former r3 tie-break.
    if (route?.priority === priority) return classify(candidates
      .filter(candidate => route.destinations.includes(candidate.key)));
    const table = arrivals[priority - 1]!;
    const best = Math.min(...candidates.map(candidate => table.get(candidate.key) ?? Infinity));
    if (Number.isFinite(best)) return classify(candidates
      .filter(candidate => table.get(candidate.key) === best));
  }
  return {stage: 0, moves: []};
}
