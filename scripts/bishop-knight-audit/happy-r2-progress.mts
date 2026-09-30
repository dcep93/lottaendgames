export interface RouteMove {
  readonly next: readonly number[];
  readonly mate: boolean;
  readonly kind: string;
}

export function routeCost(move: RouteMove, remaining: readonly number[]): number {
  if (move.mate) return 1;
  if (!move.next.length) return Infinity;
  return 2 + Math.max(...move.next.map(next => remaining[next] ?? Infinity));
}

/** Optimize only r2. Every Black reply and every unchanged rule tie must finish. */
export function happyR2Progress(
  graph: readonly (readonly RouteMove[])[], nodeCount: number, fixedR1: ReadonlySet<number>,
): number[] {
  const remaining = Array<number>(nodeCount).fill(Infinity);
  let changed = true;
  while (changed) {
    changed = false;
    for (let node = 0; node < graph.length; node++) {
      const row = graph[node]!;
      if (!row.length) continue;
      const r2 = row.filter(move => move.kind === 'r2');
      const best = fixedR1.has(node) || !r2.length
        ? Math.max(...row.map(move => routeCost(move, remaining)))
        : Math.min(...r2.map(move => routeCost(move, remaining)));
      if (best < remaining[node]!) {
        remaining[node] = best;
        changed = true;
      }
    }
  }
  return remaining;
}
