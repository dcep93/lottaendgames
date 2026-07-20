# Rook same-side waiting move

## Goal

Make Rook waiting moves follow the three supplied examples through one
orientation-independent rule:

- `8/8/8/4k3/R7/3K4/8/8 w - - 30 16` chooses `Rb4`, keeping the
  Rook on White's side of Black.
- `8/8/4k3/R7/3K4/8/8/8 w - - 46 24` chooses `Rb5` for the same
  reason.
- `8/8/2k5/R7/1K6/8/8/8 w - - 50 26` chooses `Rh5` because the
  Rook starts adjacent to White's King, so maximal distance takes precedence.

## Root cause

The current waiting rule checks safety and box preservation, then immediately
maximizes distance from Black. In each of the first two positions, the nearest
left and right boundary moves are equally far from Black, so the evaluator
accepts both sides. The observed left-side move is only an input-order accident.
The third position has a unique maximum-distance move and already selects
`Rh5`.

## Design

Add a same-side subpriority inside the visible `waiting move` rule, before its
distance comparison.

For a horizontal Rook wait, compare files relative to Black's King. For a
vertical Rook wait, compare ranks. A candidate is on White's side when the
resulting Rook and White's King have the same nonzero direction from Black on
that movement axis.

The same-side subpriority is inactive when:

- the Rook starts adjacent to White's King; or
- White's King and Black's King share the coordinate on the Rook's movement
  axis, so White has no side on that axis.

After the conditional same-side comparison, retain the existing maximal
Manhattan-distance comparison. All existing waiting eligibility requirements
remain: the move is quiet, the Rook stays safe, and the strongest box boundary
is preserved or shrunk.

Update the visible explanation to: “Keep the box. Stay on White's side of Black
unless the Rook starts next to White's King.” This copy states the complete
algorithmic distinction without mentioning FENs, squares, orientations, or box
sizes.

## Verification

- Add all three supplied positions as focused fixtures with sole ideal moves
  `Rb4`, `Rb5`, and `Rh5`.
- Assert the first two candidates win by the same-side subpriority and the
  adjacent-Rook case bypasses it and wins by maximal distance.
- Verify rotations and reflections of the three geometries make the transformed
  equivalent choices.
- Update deterministic snapshots only for policy changes caused by the general
  rule.
- Exhaustively enumerate symmetry-reduced and identity-keyed Rook graphs and
  require zero cycles.
- Run the exact 50-move verifier. If a failure remains, return one minimal
  bounded localhost replay.
- Run the complete test suite, lint, and production build.
