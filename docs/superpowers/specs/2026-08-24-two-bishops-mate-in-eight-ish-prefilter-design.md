# Two Bishops Mate-in-8-ish Prefilter Design

## Goal

Avoid generating legal moves for positions that cannot match the new
mate-in-8-ish sequence.

## Design

Pass the already-computed Phase 2 classification into the sequence matcher.
Return immediately unless the position is Phase 2, Black is on an edge, both
kings exist, and exactly two White bishops exist. Only then generate legal
moves and test the eight rotated/reflected stage templates.

This preserves every accepted sequence position because all eight supplied
stages are Phase 2 positions with Black on an edge. It does not restore a graph,
add lookahead, or change any move preference.

## Verification

- Confirm all eight canonical stages remain accepted.
- Confirm rotations/reflections remain accepted.
- Confirm a non-Phase-2 position bypasses the matcher.
- Run the focused policy test, build, and lint.
- Revalidate and load the existing h1-oriented loop at `cursor=0`.
