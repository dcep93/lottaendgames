# Rook waiting wall and replay cursor

## Goals

1. Let the Rook waiting-move rule choose `Ra4` after `Rg4 Kh3`.
2. Let diagnostic replay links open at the initial position with their complete
   move line available through Redo.

## Rook selection

The visible rules remain unchanged.

For `rook box`, an existing box is preserved when the resulting position:

- retains any existing rook wall; or
- replaces the current box with a smaller box.

Do not require the retained wall to be the current smallest wall. The later box
shrink comparison still prefers a smaller resulting box when one exists.

In `8/8/8/6K1/6R1/7k/8/8 w - - 2 2`, `Ra4` retains the rank-4 wall. Because the
kings are a knight's move apart, the waiting-move rule then prefers `Ra4`: the
Rook is as far from Black as possible, closer to White than Black, and not
touching White's king.

## Replay cursor

Canonical diagnostic replay hashes may append `&cursor=0` after `moves=...`.
That cursor means:

- render the replay's starting FEN;
- retain every reconstructed half-move in history;
- disable Undo initially; and
- enable Redo through the supplied line.

Hashes without `cursor=0` preserve the current behavior and open at the final
position. Reject other cursor values, duplicate fields, and cursor fields
without a move line.

## Verification

- Assert `Ra4` and the retained rank wall in the exact Rook position.
- Assert D4 symmetry for the changed Rook recommendation.
- Re-run the Rook loop verifier and report its new minimal witness.
- Round-trip and canonicalize `cursor=0`.
- Assert a start-cursor replay renders its starting FEN with Undo disabled and
  Redo enabled.
- Preserve the existing final-position replay test for hashes without a cursor.
