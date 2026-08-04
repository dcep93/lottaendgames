# Two Bishops Pieces Off Edge

## Goal

Replace the `bishops off edge` priority with a literal White-piece priority:

> **pieces off edge** — Move White's pieces off the edge.

## Selector

For every legal White candidate, count White's king and both bishops that occupy edge squares after the move. Minimize that integer exactly, so three edge pieces are worse than two, two are worse than one, and one is worse than zero.

The rule keeps its existing priority position immediately after `mate in 3`. It is stateless, D4-symmetric, and has no phase gate. No other Two Bishops priority changes.

## Verification

Rename the score field and rule ID, update focused semantic and presentation tests, and add a regression covering all four counts. Run targeted TypeScript, Two Bishops tests, directly affected presentation tests, and the fail-fast loop gate. Return one refreshable localhost loop. Do not run the full mate suite, commit, push, or deploy.
