# Two Bishops Onside Distance

## Goal

Update `bishop distance` to prefer only onsides bishops farther from Black's king.

## Behavior

Derive the moat from the resulting king position when the kings are a knight's move apart or in opposition. Sum king-step distance to Black only for bishops on White's side of that moat; bishops on the moat count as onside. With no active moat, the score is zero.

## Verification

Cover onside and offsides contributions under all rotations and reflections, rendered copy, TypeScript, and an exact replayed loop loaded in the sidebar.
