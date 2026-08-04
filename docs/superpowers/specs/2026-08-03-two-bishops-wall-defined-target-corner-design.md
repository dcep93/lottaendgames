# Two Bishops Wall-Defined Target Corner

## Definition

Target-corner selection is fixed from the current board before candidate moves are compared:

1. If Black is already in a corner, that occupied corner is the target.
2. Otherwise, inspect every square on Black's edge controlled by either current bishop. If all controlled squares lie on one side of Black, the target is the opposite corner along that edge.
3. If controlled edge squares exist on both sides or neither side, fall back to the corner on Black's edge closest to White's current king.

Every candidate move is scored against this same fixed corner; a move cannot improve its score by redefining the goal.

Only clear bishop lines to edge squares count. This target geometry is broader than the edge-plus-inward pair used by `phase 2 wall`.

## Required example

From `3k4/B7/3K4/8/8/8/8/7B w - - 0 1`, `Bb7` produces bishop edge-control squares `b8` and `c8`. The resulting wall is on the a8 side, so the target corner is `h8`. `Bb7 ... Ke8` must survive `sequester` and be correct.

## Consequence

The earlier `Bd4` decision remains intact: its resulting bishops control squares on both sides of Black along the h-file (`h1` and `h8`), so the fallback target is White's proximate corner, `h1`.

## Constraints and verification

Keep the policy stateless, D4 symmetric, and mechanically aligned with the rendered target-corner note. Add the supplied move and D4 transforms, wall/no-wall/both-sides fallbacks, exact copy, focused rules, presentation, TypeScript, diagrams, diff checks, and the fail-fast loop search.
