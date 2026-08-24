# Remove Rule FF and Retarget Rule G

## Goal

Delete Rule FF and update Rule G to:

> Phase 2: Prefer White's king closer to a square 2 diagonal from Black's proximate corner.

## Rule G geometry

For each proximate corner of an eligible bishop wall in the position after White moves, use the unique square two inward diagonal steps from that corner. The four targets are `c3` from `a1`, `f3` from `h1`, `c6` from `a8`, and `f6` from `h8`.

Rule G remains a resulting-position rule: it applies when White's move leaves or enters Phase 2. Rank candidates by the minimum squared Euclidean distance from White's resulting king to the applicable target squares.

## Rule FF removal

Remove Rule FF from the move-score type, result-wall computation, scorer, rule catalog, active teaching order, neutral score, rendered guidance expectations, and focused regressions. Do not retain a hidden Rule FF tie-break.

## Verification

Test exact Rule G target distances, entry into Phase 2, wall-corner selection, and all rotations and reflections. Run the full focused policy suite, build, lint, and diff checks. Find and independently validate an h1-oriented exact loop, then load it at `cursor=0`.
