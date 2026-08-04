# Two Bishops Unconditional Bishops-Off-Edge and King Distance

## Goal

Move `bishops off edge` before `force phase 2`, make it independent of the phase classifier, and add a Phase 2 `king distance` rule immediately before `sequester`.

## Rule order

The relevant visible priorities become:

1. `bishops off edge` — Move White's bishops off the edge.
2. `force phase 2` — Force Black's king to the edge and keep it there.
3. `king distance` — Phase 2: Kings should be no more than two steps apart.
4. `sequester` — Phase 2: Force Black's king towards White's king's proximate corner.

The remaining priorities retain their current order.

## Mechanics

`bishops off edge` will always apply and continue minimizing the number of White bishops on edge squares.

`king distance` measures Chebyshev distance after White's candidate move: the larger of the file difference and rank difference between the two kings. Its score is `max(0, distance - 2)`, minimized. A move therefore approaches when the kings are farther than two steps apart, while every position at distance one or two is equally satisfactory.

The rule remains board-position-only and D4 symmetric. It does not inspect history or search Black replies.

## Verification

Focused tests will verify exact order and copy, unconditional bishops-off-edge activation, capped Chebyshev scoring at distances one through four, selection ownership by `king distance`, statelessness, symmetry, safety, presentation, TypeScript, and diff validity. The fail-first Two Bishops loop finder will provide a refreshable localhost witness that is replayed and reloaded in the app.

The full mate suite, exhaustive validation, commits, pushes, deployment, and unrelated cleanup are out of scope.
