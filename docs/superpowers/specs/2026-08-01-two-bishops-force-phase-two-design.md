# Two Bishops Force Phase 2 Design

## Goal

Add a visible rule immediately after Sequester that chooses a Phase 1 move when every legal Black reply places Black's king on an edge.

## Mechanics

Render `force phase 2 — Force the Black king to the edge of the board.` The rule applies only to starting Phase 1 positions. Score a White move as satisfying the rule when Black has at least one legal reply and every legal reply ends with Black's king on an edge. If no candidate satisfies it, leave the candidates tied for later rules.

This is a current-position, one-ply, adversarial geometric test. It does not use Black's preferred-response policy, history, lookup data, or proof distance.

In `8/1B4k1/3BK3/8/8/8/8/8 w - - 24 13`, `Be4` satisfies the rule because `Kg8`, `Kh8`, and `Kh6` all finish on an edge.

## Verification

Assert the rendered order, the exact `Be4` recommendation, all-reply edge confinement, D4 symmetry, and current-board statelessness. Run focused Two Bishops tests, TypeScript, diff checks, and a bounded Phase 1 loop search. Do not run the full mate suite, commit, push, deploy, or synchronize the plan archive.
