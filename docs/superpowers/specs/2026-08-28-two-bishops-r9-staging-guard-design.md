# Two Bishops r9 Staging Guard Design

## Goal

Make r9 choose `Kg6` from
`8/8/8/k5BK/6B1/8/8/8 w - - 0 1` instead of prematurely choosing
`Kh4`.

## Design

The bishops define two tied smallest wall orientations. The preferred
orientation is `d8–e7–f6–g5` with `c8–d7–e6–f5–g4`: Black is inside the
a8-side enclosure and White is outside. Therefore r9 must remain neutral,
matching r13's existing treatment of tied smallest walls. With the wall
already controlled, r10 ties and r15 uniquely prefers `Kg6` by squared
Euclidean king distance (`37`, versus `50` for `Kh4` and `Kh6`).

When r9 does apply, its final wall-crossing branch may activate when White's king already occupies
that staging square, or when it occupies the outer wall of a unique smallest
enclosure as the immediate geometric continuation of the crossing. Adjacent
bishops alone are insufficient when multiple smallest walls are tied. Until
then, r9 scores moves by king-step distance to the staging square. This
preserves the existing `Kf3`, `Kf4` two-step crossing for a unique wall without
consulting move history.

## Verification

Add the reported position as a focused regression and require `Kg6` uniquely
under every board rotation and reflection. Run the focused Two Bishops suite,
then the cached exhaustive early-exit loop search and deliver its first valid
loop at cursor 0.
