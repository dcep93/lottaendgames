# Two Bishops Outer Wall Containment Design

## Goal

Treat White's king on either bishop wall as inside Black's smallest enclosed
area. In the reported loop, this makes `2. Kd3` lose before rule r21.

## Design

The shared enclosure predicate used by rules r9 and r13 will include the full
band through both adjacent bishop diagonals. A king on the inner wall, the
outer wall, or Black's side of the walls is inside; a king beyond the outer
wall is outside.

This changes only the boundary convention. Wall discovery, selection of the
smallest enclosure, and rule ordering stay unchanged. Because the predicate is
defined by diagonal indices, the behavior remains invariant under rotations
and reflections.

## Verification

Update focused boundary tests to cover both walls and a square beyond the
outer wall. Add the reported position after `1. Ke3+ Ka4` and verify that
`2. Kd3` is not an ideal move. Run the focused Two Bishops suite, then run the
cached exhaustive early-exit loop search and deliver its first valid loop.
