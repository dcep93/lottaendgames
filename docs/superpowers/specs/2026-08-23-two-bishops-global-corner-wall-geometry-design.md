# Two Bishops Global Corner Wall Geometry Design

## Goal

Define a bishop wall by two controlled, adjacent parallel diagonals that contain Black in a corner area. The wall need not be adjacent to Black's current square.

## Geometry

Enumerate both diagonal axes for each bishop and pair same-axis diagonals whose indices differ by one. For each corner, order the pair by distance from that corner, form the corner area from the corner-side diagonal, and retain the pair when Black lies inside that area. Choose representative wall and escape squares at the points on each diagonal closest to Black so existing Rule N, Rule WY, and screening logic keep concrete anchors.

The White king may screen a diagonal only when that screen does not provide Black an escape under the existing wall-safety semantics. Rule O continues filtering on the corner-side diagonal's distance and comparing enclosed area.

For bishops on `e1/e2` with Black near `h1`, the qualifying orientation uses the diagonal through `d1-e2`; its corner-side partner is three diagonals from `h1`. The alternate orientation through `e2-f1` is only two diagonals away and fails Rule O's threshold.

## Verification

Add the `Kf4` regression and all rotations/reflections. Preserve existing wall, screen, Rule N, Rule WY, and Rule WW tests. Run focused tests, build, lint, whitespace validation, and the loop audit; then validate and load the next loop at `cursor=0`.

