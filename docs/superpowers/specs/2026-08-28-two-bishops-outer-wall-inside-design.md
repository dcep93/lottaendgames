# Two Bishops Outer Wall Containment Design

## Goal

Treat White's king on either bishop wall as inside Black's smallest enclosed
area. In the reported loop, this makes `2. Kd3` lose before rule r21.

## Design

The shared enclosure predicate used by rules r9 and r13 will include the full
band through both adjacent bishop diagonals. A king on the inner wall, the
outer wall, or Black's side of the walls is inside; a king beyond the outer
wall is outside. Rule r13 evaluates the candidate White-king square against
the existing enclosure, so a bishop-only move does not redefine the area being
escaped during the same comparison.

Rule r7's Phase 2 proximity walk applies only while White's king is already
inside this enclosure. It therefore cannot pull an outside king onto the newly
included outer wall before r13 can reject that move. Rule r9 uses the expanded
predicate to decide whether White is inside, while retaining its stricter
Black-side-of-the-inner-wall predicate for construction staging squares.

Wall discovery, selection of the smallest enclosure, and rule ordering stay
unchanged. Because both predicates are defined by diagonal indices, the
behavior remains invariant under rotations and reflections.

## Verification

Update focused boundary tests to cover both walls and a square beyond the
outer wall. Add the reported position after `1. Ke3+ Ka4` and verify that
`2. Kd3` is not an ideal move. Run the focused Two Bishops suite, then run the
cached exhaustive early-exit loop search and deliver its first valid loop.
