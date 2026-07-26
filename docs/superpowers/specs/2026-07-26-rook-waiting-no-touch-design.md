# Rook waiting-move separation

## Goal

Keep the displayed Rook waiting-move rule mechanically aligned with the move
selector:

> **waiting move** — When the kings are a knight's move apart, keep the box and
> move the rook, as far from Black as possible, but closer to White's king, but
> not touching White's king.

## Behavior

The existing waiting-move conditions remain unchanged: move the Rook without a
capture or check, keep it safe, preserve the current box and strongest wall,
finish closer to White's king than Black's, and then maximize distance from
Black. Add one condition: the resulting Rook square must not be adjacent to
White's king.

This condition applies only when classifying a move under `waiting move`.
Adjacent Rook placements remain legal and may still be selected by another
visible rule.

## Verification

Add a direct score regression proving that an otherwise qualifying Rook move
which finishes adjacent to White's king does not satisfy `waiting move`.
Retain the existing representative waiting-move fixtures and assert the exact
displayed wording. Run the focused Rook and presentation tests, followed by the
complete mate suite.
