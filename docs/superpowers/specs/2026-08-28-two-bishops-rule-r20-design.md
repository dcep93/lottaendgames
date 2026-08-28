# Two Bishops Rule r20 Design

## Goal

Add rule r20: prefer adjacent bishops.

## Design

Rule r20 is ordered after r15. It scores a resulting position best when the
two bishop squares have king-step distance one. This board-geometric definition
is invariant under rotations and reflections. Because the bishops occupy
opposite colors, reachable adjacent placements are edge-adjacent.

Outside positions with exactly two White bishops, the rule remains neutral.

## Verification

Add a focused comparison showing that an adjacent placement defeats a
non-adjacent placement when earlier rules tie, and repeat the assertion across
all board symmetries. Run the focused Two Bishops suite and the cached exhaustive
early-exit loop search.

