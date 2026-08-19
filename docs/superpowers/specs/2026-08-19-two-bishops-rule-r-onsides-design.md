# Two Bishops Rule R Onsides Constraint

## Goal

Update Rule R so its secondary squeeze-diagonal controller cannot be placed offsides.

## Behavior

Rule R still requires knight-step kings, an existing primary squeeze diagonal, and the side edge to be closer than the rear edge. A satisfying result must use a distinct bishop on the matched secondary squeeze diagonal and that bishop must finish on White's side of the starting king moat. A bishop on the moat counts as onside. If no legal move satisfies all conditions, Rule R is inactive.

In `8/B2K3B/8/4k3/8/8/8/8 w - - 0 1`, `Be3` controls the reflected secondary but lands on Black's side of the sixth-rank moat, so it does not satisfy Rule R.

## Verification

Cover the supplied rejection, a positive fixture, and all rotations and reflections; run the focused presentation test and TypeScript check; then independently replay a loop before loading it in the sidebar.
