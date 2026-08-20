# Two-Diagonal King Moats

## Design

When the kings are two diagonal squares apart, the position has two king moats: the midpoint file and the midpoint rank.

For `bishop distance`, a bishop is onsides when it is on White's side of either active moat. Its king-step distance from Black's king is counted once, even when it is onsides relative to both moats. Knight-step and opposition positions retain their existing single-moat behavior.

## Verification

Add a focused regression for `8/3B4/8/8/4kB2/8/2K5/8 w - - 0 1` showing that `Bc7` outranks `Bd6` through `bishop distance`, plus rotations and reflections.
