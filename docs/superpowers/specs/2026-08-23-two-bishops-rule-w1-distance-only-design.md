# Two Bishops Rule W1 Distance-Only Design

## Goal

Update Rule W1 to match this exact behavior and text:

> **rule w1** — Phase 2: Prefer king proximity to the square a knight's move from Black's corner.

## Design

- Keep Rule W1 in its current priority immediately before Rule W2.
- Continue evaluating the resulting position after White's move.
- When Rule W1 applies, compare moves only by the White king's squared Euclidean distance to the applicable knight's-move target square.
- Do not penalize a move for screening the inner bishop under Rule W1.
- Retain the existing screen-detection score as diagnostic data because other tests and future rules may use the geometry, but it no longer participates in Rule W1's comparator.

## Validation

- Update the rendered rule-text assertion.
- Change the existing screen case so the closer screened king move defeats the farther unscreened move.
- Preserve screen-detection and symmetry coverage as diagnostics.
- Run the focused two-bishops policy, wall-geometry, and Phase 2 tests, then build and lint.
- Generate and independently validate a repeating loop before loading it at `cursor=0`.
