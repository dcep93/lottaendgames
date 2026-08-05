# Two Bishops: Sequester Progress Before Target Strength

## Problem

`sequester` currently maximizes target-corner strength before checking whether
Black can actually be forced toward that corner. In
`2kB4/8/2K5/1B6/8/8/8/8 w - - 2 2`, this prefers `Ba5`: it gives `h8` a
stronger target score, but the forced reply `...Kb8` moves Black away from
`h8`. `Be7` instead selects `a8` and forces `...Kb8`, which is real progress.

## Design

Keep the existing stateless, post-move target-corner calculation and all
existing score fields. Reorder the first two `sequester` subpriorities:

1. If any candidate forces every Black reply closer to its selected target
   corner, prefer the greatest forced progress.
2. Among remaining tied candidates, prefer the stronger target-corner score.
3. Preserve the existing corner-diagonals and two-away-control comparisons.

This makes target strength a tiebreaker among equally enforceable plans instead
of allowing an attractive but unenforceable target to dominate actual progress.
The rendered rule remains accurate and unchanged.

## Verification

- Add a semantic regression proving `Be7` is recommended, `Ba5` is rejected,
  and every surviving move forces Black toward its selected target corner.
- Run the focused Two Bishops rule tests.
- Run TypeScript and `git diff --check`.
- Find and load the next structural cycle whose full boundary remains Phase 2.

## Assumptions

- “Unable to force Black to move towards it” means no legal Black reply is
  closer to that move's selected target corner.
- Target-corner strength remains useful only after forced progress is equal.
