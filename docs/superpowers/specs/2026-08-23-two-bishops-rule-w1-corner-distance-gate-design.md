# Two Bishops Rule W1 Corner-Distance Gate Design

## Goal

Update Rule W1 to this exact text and behavior:

> **rule w1** — Phase 2: Prefer king proximity to the square a knight's move from Black's corner, if Black's king is within 2 moves from that corner.

## Design

- Preserve Rule W1's existing post-move Phase 2 evaluation and distance-only comparison.
- Treat a king move as Chebyshev distance, matching ordinary king movement.
- Consider only tightest Phase 2 walls whose corner is at king distance 2 or less from Black's king.
- If no qualifying wall corner exists, Rule W1 does not apply.
- Preserve the current priority immediately before Rule W2.

## Validation

- Update the exact help-text assertion.
- Preserve the distance scoring at Black king distance 2.
- Add an exclusion test at Black king distance 3.
- Preserve symmetry, screening diagnostics, focused tests, build, and lint.
- Generate, independently validate, orient, and load a loop at `cursor=0`.
