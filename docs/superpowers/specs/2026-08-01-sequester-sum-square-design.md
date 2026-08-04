# Sequester Sum-Square Distance Design

## Goal

Measure White king proximity to the knight-move support squares beside Black king's proximate corner using sum-square distance instead of Manhattan distance.

## Selection behavior

For each candidate White move:

1. Determine the corner or tied corners nearest Black's current king.
2. Enumerate the on-board squares a knight's move from those corners.
3. From White's resulting king square, calculate `fileDelta ** 2 + rankDelta ** 2` to each support square.
4. Use the minimum as `sequesterCornerSupportDistance`.

Sequester's priority order remains:

1. Keep every legal Black reply on the edge.
2. Minimize the sum-square corner-support distance.
3. Minimize Black replies that fail to approach White's proximate corner.

No square root is needed because it would not change move ordering. The rule remains current-position-only and symmetric, and its rendered text does not change.

## Verification

Add direct metric assertions for the supplied position: `Ke4` has support distance 5 and `Kg6` has support distance 9. Assert that `Kg6` is no longer recommended over `Ke4` by Sequester's later corner-direction comparison. Run focused Two Bishops tests, TypeScript, and the small fail-fast loop gate. Do not run the full mate suite, commit, push, or deploy.
