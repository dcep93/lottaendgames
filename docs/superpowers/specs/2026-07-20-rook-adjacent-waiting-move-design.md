# Rook adjacent waiting move

## Goal

From `8/2k5/R7/1K6/8/8/8/8 w - - 2 2`, choose `Rh6` as the sole
best move and explain rejected king moves with the visible `waiting move` rule.
The correction must be geometric and must not depend on a FEN, orientation,
square, or box size.

## Root cause

The kings are a knight's move apart, one of the existing Rook tempo shapes, and
White already has a safe rank box. The evaluator nevertheless disables this
waiting shape when the Rook is adjacent to White's King. That exclusion makes
the waiting priority inactive, so `king closer` selects `Kc5`. Black can answer
`Kb8`, after which the same priorities select `Kb5`; Black returns with `Kc7`
and the exact position repeats.

## Design

Remove the Rook-adjacency exclusion from the general knight-move king geometry.
Whenever a Rook box exists and the kings are a knight's move apart, require a
waiting move whether or not the Rook begins beside White's King.

Keep all existing move qualifications:

- the move is a quiet Rook move;
- the Rook remains safe;
- the move preserves or shrinks the box;
- the move retains a strongest box boundary; and
- existing distance tie-breaks choose the Rook square farthest from Black.

For the supplied position, horizontal moves preserve the rank boundary and
`Rh6` maximizes distance from Black. `Kc5` is rejected by `waiting move`.
Displayed copy does not change because the current instruction already
describes the behavior.

## Verification

- Add the supplied FEN to the focused Rook fixtures with sole ideal move `Rh6`.
- Assert the waiting score activates for `Rh6`, rejects `Kc5`, and explains the
  rejection with `waiting move`.
- Update deterministic snapshots only where this general rule changes selected
  moves.
- Exhaustively enumerate the symmetry-reduced and identity-keyed Rook policy
  graphs. If any cycle remains, report one shortest exact replay beginning at
  its cycle boundary.
- Run the exhaustive 50-move verifier, complete tests, lint, and production
  build.
