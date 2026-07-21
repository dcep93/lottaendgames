# Two Bishops Corner Phase Classification Design

## Goal

Correctly recognize Two Bishops phase 2 when Black is in a corner and every
legal Black move continues toward White along either of the corner's two
edges.

## Geometry

The diagonal edge-walk phase already requires:

- White's king to be two files and two ranks from Black's king;
- Black's king to be on an edge; and
- every legal Black reply to stay on an edge and move toward White.

Keep those requirements. Replace the mutually exclusive file-edge/rank-edge
branch with two independent predicates:

- a move qualifies on the file edge when Black starts on the a- or h-file,
  remains on that file, and reduces its rank distance to White;
- a move qualifies on the rank edge when Black starts on the first or eighth
  rank, remains on that rank, and reduces its file distance to White.

A reply qualifies when either predicate is true. This preserves non-corner
behavior and lets a corner use either occupied edge.

## Regression

After `Bf3 Ka1` from
`8/8/8/8/8/2K5/5BB1/1k6 w - - 0 1`, the resulting position must be phase 2.
The same must hold under all eight board rotations and reflections. Therefore
`Bf3` must not receive a `keep phase two` penalty at the supplied start.

No ordered priority, rule copy, or Black-resistance behavior changes.

## Verification

- Add direct phase and `keep phase two` score assertions.
- Check all eight geometric transforms.
- Run focused Two Bishops tests and the exhaustive Two Bishops verifier.
- Run lint, build, and a diff check.
