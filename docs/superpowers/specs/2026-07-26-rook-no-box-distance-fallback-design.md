# Rook no-box distance fallback

## Goal

Keep the existing rook-box geometry: a rook wall is a box only when the wall is
between the kings. When no surviving legal move can create such a box, move the
rook as far from Black's king as possible.

## User-facing rule

**rook box** — Create, keep, and shrink a box for Black's king and the edge of
the board. Move an attacked rook as far from Black as the box allows. If a box
cannot be created, move the rook as far as possible from Black's king.

## Mechanical selection

The existing box priorities remain first:

1. Keep an existing valid box.
2. If the rook is attacked, move it as far from Black as the box permits.
3. If every surviving candidate has no valid box, prefer a rook move and
   maximize the rook's distance from Black's king.
4. Continue with the remaining rook priorities only after this fallback ties.

Distance is compared by king-move distance first and row-plus-file distance
second. The fallback uses only the resulting board position and does not inspect
move history.

## Acceptance examples

- In `8/R4K1k/8/8/8/8/8/8 w - - 2 2`, `Ra6`, `Ra8`, and `Ra1` do not create a
  box because none places the rook wall between the kings.
- With no valid box available there, `Ra1` is preferred because it places the
  rook farthest from Black's king.
- Rotations and reflections select the corresponding transformed move.
- Existing positions with a valid box continue to use the established box
  geometry and priorities.

## Verification

- Assert the exact user-facing text.
- Assert the three example rook moves are classified as no-box results.
- Assert the no-box comparison prefers `Ra1`.
- Run the focused rook rule tests and the bounded rook loop verifier. Report any
  resulting loop or fifty-move line without adding an unapproved exception.
