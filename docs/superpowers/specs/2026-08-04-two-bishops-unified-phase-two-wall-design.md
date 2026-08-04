# Two Bishops Unified Phase 2 Wall Design

## Goal

Use one mechanically consistent definition of a Phase 2 bishop wall throughout Two Bishops policy. Two adjacent squares on Black's edge are an edge barrier, not a two-square wall.

For `8/8/8/2KB4/k7/2B5/8/8 w - - 2 2`, the target remains `a8`, and `Bc4` must not satisfy `phase 2 wall`.

## Wall Definition

A Phase 2 wall consists of exactly two orthogonally adjacent squares:

1. one square on Black's current edge; and
2. one square immediately inward from that edge.

Distinct bishops must control the two squares. A bishop may not occupy Black's edge. This is the existing rendered `phase 2 wall` geometry.

Neither wall square may touch White's king: each must have Chebyshev distance greater than one from White's king.

## Target Selection

- Keep the relative king-race fallback and candidate-result calculation.
- A wall may determine the forced target direction only when it satisfies the edge-plus-inward and no-king-contact definitions and all legal Black replies move along the edge in the same direction.
- An exact king-race tie may be resolved only by edge-plus-inward walls.
- Adjacent edge controls such as `a5/a6` never determine or break a target-corner tie.

## Architecture

- Remove the separate adjacent-edge-pair wall enumerator.
- Enumerate valid edge-plus-inward walls from Black's edge geometry independently of an already selected target.
- Reuse that enumeration for forced-direction target selection and race-tie resolution.
- Keep target-specific `phase 2 wall` validation on the same underlying square-pair geometry.

## Verification

- In the supplied position, `Bc4` retains target `a8` and fails `phase 2 wall` because the `a5/b5` wall touches White's king on `c5`.
- Cover all eight D4 transforms.
- Preserve relative king-race, nearest-wall tie-break, forced-direction, statelessness, and symmetry tests.
- Run focused Two Bishops rules, directly affected presentation tests only if rendered copy changes, TypeScript, diagrams, diff checks, and an all-Phase-2 fail-fast loop scan.

## Non-goals

- No rule-order, rendered-copy, phase-definition, history, or search changes.
