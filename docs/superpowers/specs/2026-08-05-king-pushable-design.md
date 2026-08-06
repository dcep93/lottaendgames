# Phase 1 King Pushable Design

## Goal

Add `king pushable` immediately before `king closer` in the Two Bishops White priority stack:

> **king pushable** — Phase 1: Bring the White king towards the restricted area diagonal.

The priority advances White's king toward an already-established restricted-area boundary without letting bishop motion masquerade as king progress.

## Behavior

- The rule is Phase 1-only.
- It activates when the starting position has a valid restricted area.
- Distance is the minimum squared Euclidean distance from White's king to any board square on either bishop boundary diagonal of the smallest valid confinement.
- Every candidate is scored against the starting boundary diagonals. Bishop moves retain the source king distance, so moving a diagonal cannot masquerade as king progress.
- The smallest resulting king distance wins. This advances the king when possible and prevents `king closer` from pulling a king away after it reaches a boundary. `king closer` remains the next priority among equal-distance survivors.
- The calculation uses the existing restricted-area geometry and remains invariant under every D4 board symmetry.

## Implementation

Extend the shared position context with the starting restricted-area boundary diagonals. Extend each White move score with an applicability flag and the resulting king-to-boundary distance. Add the ordered rule between `prep restricted area` and `king closer`.

## Verification

- Assert rule metadata and priority order.
- Assert that a reducing king move beats bishop and non-reducing alternatives in a Phase 1 cage.
- Assert that a king already on a boundary may move along it but may not be pulled away by `king closer`.
- Assert Phase 2 inactivity.
- Assert the selected move and distance transform correctly under all D4 symmetries.
- Run the focused Two Bishops and presentation suites, type checking, linting, and diagram freshness checks.

## Assumptions

“Towards” means minimizing squared Euclidean distance to the nearest boundary diagonal of the current restricted area and maintaining that minimum once reached. The rule does not ask the bishops to move a diagonal toward the king.
