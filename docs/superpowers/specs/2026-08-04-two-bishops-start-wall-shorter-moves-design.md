# Two Bishops Start Wall Shorter Moves Design

## Goal

Refine the Phase 1 `start wall` rule so that, when multiple moves actually create the required two-square bishop opposition, the shortest qualifying bishop move is preferred.

## Semantics

The rule has two ordered subpriorities:

1. Prefer moves that start a wall under the existing eligibility gates: no starting opposition, no existing proximate wall, the move is by a bishop, and its destination is in two-square opposition to Black's king.
2. If and only if every surviving move started a wall, prefer the bishop move that travels the fewest diagonal squares.

Move length is the Chebyshev distance from the bishop's source to destination, which equals the number of diagonal squares traversed.

When no candidate starts a wall, every candidate ties at the first subpriority and the second subpriority is disabled. The rule therefore does not compare bishop move lengths, does not prefer bishops over kings, and leaves fallback selection unchanged.

## Presentation

The visible help text is exactly:

`Phase 1: Place a bishop in two-square opposition to Black's king, preferring shorter bishop moves.`

## Implementation

- Add a nullable `startWallMoveDistance` score field populated only for moves whose `startWallPenalty` is zero.
- Convert `start wall` from one comparator to two subpriorities.
- Keep the existing Phase 1 applicability gate.
- Update the manual cascade and visible rule-shape assertions.

## Verification

Tests must prove:

- Among two wall-starting bishop moves, the shorter move wins.
- When no move starts a wall, shorter bishop moves do not affect selection or pairwise comparison.
- Existing opposition and proximate-wall gates still disable wall starting.
- The exact help copy is visible.
- Full rule and presentation suites, diagram consistency, TypeScript, and diff checks pass.
- A fresh seeded cycle stays entirely in Phase 1; entering Phase 2 terminates loop search.
