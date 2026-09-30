import type {Square} from 'chess.js';
import {getChess, getEndgamePiecePlacements, SQUARE_TRANSFORMS, transformSquare} from '../chess';
import data from './bishopKnightStageData.json';

export type BishopKnightStage = 0 | 1 | 2;
export const r1Start = data.r1Start;
export const r2Starts: readonly string[] = data.r2Starts;
type Route = {stage: 1 | 2; remaining: number; destinations: readonly string[]};
const routes = new Map<string, Route>();
const arrivals = [new Map<string, number>(), new Map<string, number>()];
const bounds = new Map<string, number>();
const reflect = (key: string, transform: typeof SQUARE_TRANSFORMS[number]) =>
  (key.match(/../g)! as Square[]).map(square => transformSquare(square, transform)).join('');

for (const [key, bound] of data.arrivals) for (const transform of SQUARE_TRANSFORMS) {
  bounds.set(reflect(key as string, transform), bound as number);
}

for (const row of data.sources) {
  const [source, stage, remaining, destinations] = row as [string, 1 | 2, number, string[]];
  for (const transform of SQUARE_TRANSFORMS) {
    const reflected = destinations.map(key => reflect(key, transform));
    routes.set(reflect(source, transform), {stage, remaining, destinations: reflected});
    destinations.forEach((key, index) => {
      // Canonicalization of the bound is independent of the source orientation.
      const bound = bounds.get(key) ?? Infinity;
      if (!Number.isFinite(bound)) throw new Error(`Missing stage destination bound: ${key}`);
      arrivals[stage - 1]!.set(reflected[index]!, bound);
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
  return fen.split(' ')[1] === 'w' ? routes.get(bishopKnightPositionKey(fen) ?? '') : undefined;
}

/** Recognize a whole resulting position, independent of the moving piece or history. */
export function bishopKnightStageMoves(fen: string): {stage: BishopKnightStage; moves: readonly string[]} {
  if (fen.split(' ')[1] !== 'w') return {stage: 0, moves: []};
  const key = bishopKnightPositionKey(fen);
  if (!key) return {stage: 0, moves: []};
  const route = routes.get(key);
  const legal = getChess(fen).moves({verbose: true});
  const candidates = legal.map(move => ({move, key: bishopKnightPositionKey(move.after)!}));
  for (const stage of [1, 2] as const) {
    // Preserve the exact established choices, including any former r3 tie-break.
    if (route?.stage === stage) return {stage, moves: candidates
      .filter(candidate => route.destinations.includes(candidate.key))
      .map(({move}) => move.from + move.to)};
    const table = arrivals[stage - 1]!;
    const best = Math.min(...candidates.map(candidate => table.get(candidate.key) ?? Infinity));
    if (Number.isFinite(best)) return {stage, moves: candidates
      .filter(candidate => table.get(candidate.key) === best)
      .map(({move}) => move.from + move.to)};
  }
  return {stage: 0, moves: []};
}
