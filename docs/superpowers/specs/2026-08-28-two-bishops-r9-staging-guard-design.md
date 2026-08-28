# Two Bishops r9 Staging Guard Design

## Goal

Make r9 choose `Kg6` from
`8/8/8/k5BK/6B1/8/8/8 w - - 0 1` instead of prematurely choosing
`Kh4`.

## Design

The two controlled walls are `c1–d2–e3–f4–g5–h6` and
`d1–e2–f3–g4–h5`. White on `h5` is inside because it occupies the outer
wall. The r9 staging square is `g6`: it is edge-adjacent to the inner bishop
on `g5`, lies on Black's side of that inner wall, and is farther from Black
than the other candidate `f5`.

The final wall-crossing branch may activate only when White's king already
occupies that staging square. Adjacent bishops alone are insufficient. Until
then, r9 scores moves by king-step distance to the staging square, making
`Kg6` unique here. Once White reaches `g6`, the existing aligned three-piece
geometry and wall-crossing behavior remain unchanged.

## Verification

Add the reported position as a focused regression and require `Kg6` uniquely
under every board rotation and reflection. Run the focused Two Bishops suite,
then the cached exhaustive early-exit loop search and deliver its first valid
loop at cursor 0.
