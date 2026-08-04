# Two Bishops Degenerate King Flank Design

## Goal

Add a Phase 1 degenerate repair named `degenerate — king flank` for:

`8/3k4/8/4K3/4BB2/8/8/8 w - - 0 1`

The repair selects `Kf6` instead of the current `king closer` recommendation.

## Relative Pattern

Use White's king as the origin. In the canonical orientation:

- White's king is at `(0, 0)` (`e5`).
- Black's king is at `(-1, +2)` (`d7`).
- White's bishops are at `(0, -1)` and `(+1, -1)` (`e4`, `f4`).
- White's king moves to `(+1, +1)` (`f6`).

Match the arrangement under translation and all eight D4 rotations and reflections. The target must be a legal White king move. Nearby arrangements and off-board targets do not match.

## Rule Integration

Add `degenerate — king flank` to the existing degenerate repair system. It is available only in Phase 1 and appears before the existing Phase 1 `king sidestep` and `reform wall` repairs in degenerate priority order. The existing mandatory priorities continue to outrank degenerate repairs.

The generic visible priority remains `degenerate`; move explanations and diagrams use the refined `degenerate — king flank` label.

## Diagram

Add a generated Phase 1 note board titled `degenerate — king flank`, using the exact supplied FEN, with no highlights and an arrow from `e5` to `f6`.

## Verification

Tests must prove:

- The canonical position uniquely recommends `Kf6` with refined reason `degenerate — king flank`.
- The matcher follows translation and every D4 transform.
- The repair is inactive in Phase 2 and rejects nearby geometry.
- The exact generated diagram uses the supplied position and arrow `e5 -> f6`.
- The visible degenerate order and manual cascade remain synchronized.
- The full rule and presentation suites, diagram check, TypeScript build, and diff check pass.
- A fresh seeded cycle stays entirely in Phase 1; entering Phase 2 terminates loop search.
