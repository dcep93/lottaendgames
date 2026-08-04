# Two Bishops Phase 2 With a Central King

## Goal

Remove `pieces off edge` and make White's central king part of the Phase 2 invariant.

The rendered priority becomes:

> **force phase 2** — Force Black's king to the edge with White's king in the middle 16 squares.

The rendered note becomes:

> Phase 2: Black's king is forced to stay on the edge with White's king in the middle 16 squares.

## Mechanics

The middle 16 squares are c3 through f6. A Black-to-move position is Phase 2 only when Black's king is currently on an edge, every legal Black king move remains on an edge, and White's king is in the middle 16.

A White-to-move position is Phase 2 when White has a legal move producing that Black-to-move condition. The `force phase 2` selector uses the same condition on each candidate result, so the classifier, rule, and rendered language stay aligned.

Remove the `pieces off edge` rule, score field, comparisons, rendered copy, and exclusive tests. Preserve its priority slot by moving `force phase 2` directly after `mate in 3`. No other rule changes.

## Verification

Focused tests cover the middle-16 boundary, both side-to-move semantics, D4 symmetry, and the absence of the removed selector. Run targeted TypeScript, focused Two Bishops tests, directly affected presentation tests, diagram freshness, and the small fail-fast loop gate. Return one refreshable localhost loop. Do not run the full mate suite, commit, push, or deploy.
