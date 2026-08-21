# Two Bishops Megadeth Box

## Rule

Add immediately before `king closer` in both phases:

> **megadeth box** — With the king on the edge and a bishop controlling inward adjacent square, place the other bishop in middle-16-squares opposition to the king.

## Geometry

“King” means Black's king. For each board edge occupied by Black, its inward adjacent square is the orthogonally adjacent square one step away from that edge. At a corner, either inward square may qualify.

A legal bishop move satisfies the rule when the resulting position has one bishop with an unobstructed attack on an inward adjacent square and the other bishop in two-square orthogonal opposition to Black's king on a middle-16 square (`c3–f6`). The two roles must use distinct bishops.

The rule is inserted after `death box` and immediately before `king closer`, as requested. It may overlap `death box`; in that case the earlier rule remains the displayed reason.

## Verification

Use the `a5` geometry: `Bc4` controls `b5`, and middle-16 `Bc5` opposes Black's king on `a5`. Add an outside-middle-16 rejection, cover rotations and reflections, exact rule order and rendered copy, then load a current verified loop at `cursor=0`.
