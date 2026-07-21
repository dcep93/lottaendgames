# Rook preferred-between waiting move

## Goal

Choose `Ra6` from
`8/5k2/7R/6K1/8/8/8/8 w - - 2 2` by treating the between-pieces geometry
as a preference rather than a mandatory waiting-move condition. The behavior
must be geometric and symmetry-safe, without a FEN, square, orientation, or
box-size exception.

## Visible rule

Display:

> **waiting move** — If the kings are a knight's move apart, move the rook,
> keeping the box, ideally with white's king between the other pieces, but the
> rook should not be adjacent to white's king.

## Evaluator

The waiting priority continues to activate exactly when an existing Rook box
exists and the kings are a knight's move apart.

A base waiting move must be a quiet, nonchecking, safe Rook move; preserve or
shrink the box; retain a strongest boundary; and finish more than one king move
from White's King. Rank candidates inside the single visible rule:

1. a base waiting move that leaves White's King strictly between the resulting
   Rook and Black's King on the Rook's movement axis;
2. a base waiting move without the between-pieces geometry; then
3. every other move.

When waiting is inactive, every move ties at this rule. Later visible
priorities resolve ties inside each active tier. This keeps `rook farther` as
the distance tie-break without introducing another displayed or hidden reason.

In the supplied position, no nonadjacent waiting move can put White's King
between the other pieces. The valid fallback Rook moves still beat King moves,
and `rook farther` selects `Ra6`.

## Verification

- Assert the exact visible rule copy.
- Pin `Ra6` as the sole best move in the supplied position and assert that a
  King move loses at `waiting move`.
- Retain a position where a between-pieces waiting move beats a valid fallback,
  proving that “ideally” is an actual preference.
- Retain a position where an otherwise valid adjacent Rook move is rejected.
- Verify affected positions across all D4 rotations and reflections.
- Run focused Rook rules, the exact identity-keyed Rook verifier, session and
  presentation tests, lint, and the production build.
- If exhaustive verification still finds a cycle or 50-move draw, report one
  shortest replay from its minimal cycle or draw boundary.
