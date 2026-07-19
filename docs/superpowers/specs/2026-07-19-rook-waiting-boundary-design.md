# Rook Waiting Boundary Design

## Goal

In `8/8/8/8/8/5K1k/6R1/8 w - - 10 6`, choose `Rg4` as the Rook waiting move. The correction must generalize through geometry, not a FEN, square, orientation, or box-size special case.

## Root cause

The position activates both exact mate progress and waiting-move scoring. Exact progress is evaluated first and selects `Re2`. Separately, the edge-finish waiting exception accepts quiet adjacent Rook moves even when they abandon the current strongest boundary. A later same-file preference cannot correct either issue.

## Rule

The edge-wait geometry is split by Black's distance from the nearest corner, a measurement already used by the Rook tempo evaluator:

- When Black is on an edge exactly two squares from the nearest corner, direct opposition with the Rook beside White's King activates the boundary-preserving wait: exact mate-progress scoring pauses, and the waiting move must preserve or shrink the box and retain a current strongest boundary.
- Other waiting geometries retain their existing exact-progress behavior and edge-finish exception. This preserves the loop-breaking policy outside the targeted geometric family.

This implements the displayed instruction to make a safe waiting move that keeps the box in the supplied geometry. It does not mention or special-case a particular box size, FEN, square, or orientation.

## Regression and proof

The supplied FEN must have the sole ideal move `Rg4`, with `Re2` rejected by the waiting-move priority. Existing edge-finish fixtures will be updated to require boundary-preserving tempos.

After focused tests, rerun the exhaustive Rook verifier with symmetry keys and identity keys, plus the independent identity-keyed policy rank derivation. These checks cover every tied optimal White move and every legal Black response, including fifty-move failures. Finish with the full repository suite, lint, and production build.
