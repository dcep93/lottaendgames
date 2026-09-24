import { canonical, pair } from './encoding.mts';

// White has already been filtered to preferred moves. Every non-capturing
// legal Black reply survives; captures are recorded separately as terminals.
// Use the legacy pair encoding with NONE history for snapshot compatibility.
export function policyEdges(policy: { branches: { post: number; base: number[]; w: number; b: Record<number, number> }[] }): number[][] {
    return policy.branches.flatMap(branch => branch.base.map(target => [
        pair((branch.post & ~63) | target), canonical(branch.post), branch.w, branch.b[target]!,
    ]));
}
