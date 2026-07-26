# Rook Hanging-Shrink Waiting Design

## Goal

Restore the position-only waiting trigger for a box that cannot be shrunk
without hanging the Rook.

## Visible Rule

> **waiting move** — When the kings are a knight's move apart, or if shrinking
> the box would hang the rook, keep the box and move the rook, as far from Black
> as possible, but closer to White's king, but not touching White's king.

## Classifier

`waiting move` applies when a box exists and either:

1. the kings are a knight's move apart; or
2. at least one legal Rook move strictly shrinks the current box, and every
   legal Rook move that strictly shrinks it leaves the Rook legally capturable
   by Black on the next move.

The unsafe-shrink trigger is false when no shrinking Rook move exists. If any
safe shrinking Rook move exists, `rook box` selects that shrink instead.

Checking squeezes continue to use the existing all-replies box calculation.
They are not classified as hanging direct wall moves.

## Waiting-Move Selection

Once either trigger applies, the existing requirements remain:

- move the Rook without capturing or checking;
- keep the Rook safe;
- preserve the existing box;
- leave the Rook closer to White's King than Black's King;
- do not leave the Rook touching White's King; and
- maximize distance from Black, using row-plus-file distance only as a
  tie-break.

## Verification

- In `1k6/8/R7/2K5/8/8/8/8 w - - 0 1`, prove the only direct shrink hangs the
  Rook and select the farthest qualifying waiting move.
- Retain the prior unsafe-shrink fixture
  `6k1/8/7R/5K2/8/8/8/8 w - - 0 1`.
- Prove the trigger remains off when `Rh7` safely shrinks the box in
  `3k4/8/7R/2K5/8/8/8/8 w - - 0 1`.
- Run focused Rook and geometry tests, TypeScript, the source audit, and one
  low-priority exhaustive Rook verifier.
