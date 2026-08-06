# Rule W Closest-Corner Tiebreak Design

## Goal

Update Rule W to read and behave as:

> **rule w** — Phase 1: Move the king towards the target square, preferring further distance from Black's closest corner.

## Ranking

Keep Rule W inside the existing Phase 1 target-building gate and split its comparison into two ordered subpriorities:

1. Minimize White king's squared Euclidean distance to the Phase 1 target square after the move.
2. Among candidates tied on target distance, maximize White king's Chebyshev distance from Black's closest corner.

When Black is equally close to multiple corners, score White's resulting king by its minimum Chebyshev distance to those tied corners. This prevents a candidate from winning merely because it is far from one tied corner while remaining close to another, and preserves D4 symmetry.

Bishop moves retain White king's current square for both metrics. Phase 2 behavior, the target-square definition, and every later rule remain unchanged.

## Verification

Add the new score field to the public diagnostic score shape and the independent priority-order oracle. Cover direct primary ordering, a target-distance tie broken by corner distance, and D4 symmetry. Update the rendered help text and rule-shape expectations. Run the Two Bishops and presentation tests, TypeScript, lint, and diagram validation. Then find and open a local Phase 1 cycle on port 5173, treating entry into Phase 2 as termination.
