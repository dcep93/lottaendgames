# Two Bishops Chebyshev Phase 2

## Definition

Render:

> Phase 2: Black's king forced to the edge, White's king two steps away from Black's king.

“Two steps” means exact Chebyshev distance 2:

`max(abs(white file - black file), abs(white rank - black rank)) === 2`

## Turn semantics

- On Black's turn, the current board is Phase 2 only when Black is forced to remain on an edge and the kings are exactly two Chebyshev steps apart.
- On White's turn, the current board is Phase 2 only when White has a legal move whose result forces Black to remain on an edge with the kings exactly two Chebyshev steps apart.
- The definition is current-position-only, counter-independent, and D4 symmetric.

## Scope

Replace only the prior exact-two-from-edge king predicate and rendered note. Phase rules, White-turn lookahead, Black confinement, target-corner logic, and strategic priority order remain unchanged.

## Verification

Test exact orthogonal and diagonal distance-two positions, distance-one and distance-three negatives, White-turn entry, Black-turn classification, the supplied family, all D4 transforms, rendered copy, TypeScript, diagrams, diff checks, and the fail-fast loop search.
