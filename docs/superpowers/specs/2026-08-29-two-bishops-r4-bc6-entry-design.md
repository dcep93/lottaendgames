# Two Bishops Rule r4 Bc6 Entry Design

## Goal

From `1k1KBB2/8/8/8/8/8/8/8 w - - 2 2`, uniquely prefer `Bc6` and attribute it to rule r4 under every rotation and reflection.

## Design

Extend the existing symmetry-expanded r4 entry-exception map with this FEN and result. Keep entry exceptions separate from the certified mating-kernel map, so the kernel audit continues to cover only fully enumerated mating branches. Subsequent positions use the normal ordered rules unless they independently satisfy r4.

Broadening r4 geometry is rejected because this is another explicit classification exception and should not alter unrelated positions.

## Verification

Add a focused symmetry regression for unique `Bc6` and r4 attribution, run the focused Two Bishops suite, then run the cached early-exit loop search and load the first genuine non-r4 loop at cursor 0.
