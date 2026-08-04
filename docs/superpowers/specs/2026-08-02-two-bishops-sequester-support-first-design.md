# Two Bishops Sequester Support-First Design

## Goal

Swap Sequester's White-king support and Black-corner forcing priorities so White establishes the correct king support square before choosing among ways to force Black toward a corner.

## Rendered Rule

> **sequester** — Phase 2: Ensure Black cannot leave the edge. Prefer keeping White's king closer to the square a knight's move from the corner, then prefer forcing Black's king towards White's king's proximate corner.

## Mechanical Order

1. Prefer candidates for which every legal Black king reply remains on an edge.
2. Minimize White king's existing sum-square distance to the appropriate knight-support square for Black's proximate corner.
3. Minimize Black's worst raw post-reply Manhattan distance to White's proximate corner.

No score formula changes. Only the second and third Sequester comparisons and their rendered clauses swap.

## Expected Effects

- In `8/8/8/8/8/3B1K2/3B3k/8 w - - 0 1`, `Kf2` becomes uniquely correct instead of the tied `Bf5` and `Bf1`, breaking the current bishop-shuffle loop.
- In `8/5B1k/8/4BK2/8/8/8/8 w - - 2 2`, `Kf6` remains uniquely correct.

## Verification

- Assert exact rendered copy and three-subpriority order.
- Update the manual displayed-order selector calculation.
- Add the current loop-root regression for unique `Kf2`.
- Preserve the `Kf6` raw-distance regression.
- Replace any historical fixture whose expected winner depended on the old order with semantic assertions for the metric it owns.
- Run focused Sequester, rule-order, Unmask, and Phase 2 tests; targeted TypeScript; and diff hygiene.
- Run the small fail-fast gate and return one verified localhost loop.

## Non-goals

- Do not change either distance formula, edge confinement, Unmask, phase classification, Black priorities, or any other rule.
- Do not run the full mate suite, commit, push, or deploy.
