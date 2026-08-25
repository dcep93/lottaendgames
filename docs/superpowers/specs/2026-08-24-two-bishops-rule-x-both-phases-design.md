# Two Bishops Rule X in Both Phases

## Goal

Allow rule X to break ties in both Phase 1 and Phase 2. Rule X continues to prefer the resulting bishop pair with the greatest summed Euclidean distance from Black's king.

## Behavior

Remove only Rule X's Phase 2 applicability gate. Preserve its existing post-move distance calculation, rule priority, and tie behavior. In `8/8/3K4/3BBk2/8/8/8/8 w - - 2 2`, Rule X must prefer `Bh2` over `Bg3` because `2 + sqrt(13)` is greater than `2 + sqrt(5)`.

No other rule changes. Earlier active priorities may still override Rule X in other positions.

## Verification

Add a regression test for the Phase 1 `Bh2` decision, update the Rule X description, run the focused Two Bishops tests and production build, then find and load a verified exact loop at `cursor=0` with Black's nearest corner oriented toward h1 when possible.
