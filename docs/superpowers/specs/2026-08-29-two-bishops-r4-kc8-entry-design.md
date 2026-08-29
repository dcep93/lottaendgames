# Two Bishops Rule r4 Kc8 Entry Design

## Goal

From `3KBB2/8/1k6/8/8/8/8/8 w - - 0 1`, uniquely prefer `Kc8` and attribute it to rule r4 under every rotation and reflection.

## Design

Extend the separate symmetry-expanded r4 entry-exception map with the supplied FEN and `Kc8` result. Do not broaden r4 geometry or add the position to the certified mating-kernel map. Subsequent positions continue through the normal ordered rules unless they independently satisfy r4.

## Verification

Add a symmetry regression for unique `Kc8` and r4 attribution, run the focused Two Bishops suite, then run the cached loop search and load the first genuine non-r4 loop at cursor 0.
