# Rook nonadjacent waiting move

## Goal

Make knight-distance the sole `waiting move` trigger and disallow waiting moves
that finish with the Rook adjacent to White's King. The behavior must remain
geometric and symmetry-safe, without a FEN, square, orientation, or box-size
exception.

## Visible rule

Display:

> **waiting move** — If the kings are a knight's move apart, move the rook,
> keeping the box, and with white's king between the other pieces, but the rook
> should not be adjacent to white's king.

## Evaluator

The waiting priority activates exactly when an existing Rook box exists and the
kings are a knight's move apart. Remove the unsafe-box-shrink trigger and all
position-scanning support added for it.

An accepted waiting move must remain a quiet, nonchecking, safe Rook move;
preserve or shrink the box; retain a strongest boundary; leave White's King
strictly between the resulting Rook and Black's King on the Rook's movement
axis; and finish more than one king move from White's King.

If no legal Rook move satisfies every condition, all moves receive the waiting
penalty and later visible priorities decide. The existing `establish box` rule
continues to allow adjacent Rook placements; adjacency is forbidden only when
classifying a waiting move.

This supersedes the unsafe-shrink waiting design and the adjacency-agnostic
waiting design.

## Verification

- Assert the exact visible rule copy.
- Prove unsafe shrinking alone no longer activates waiting.
- Prove an otherwise qualifying waiting move fails when its resulting Rook is
  adjacent to White's King.
- Update focused best-move fixtures only where the literal trigger or candidate
  change alters the ordered rule result.
- Verify affected positions across all D4 rotations and reflections.
- Run focused Rook rules, the exact identity-keyed Rook verifier, session and
  presentation tests, lint, and the production build.
- If exhaustive verification still finds a cycle or 50-move draw, report one
  shortest replay from its minimal cycle or draw boundary.
