# Two Bishops Phase 1 Target-Square Rules

## Goal

Replace the current Phase 1 cage-building stack with five target-square rules while leaving the Phase 2 strategy and the later global priorities unchanged.

The removed rules are `ideal cage`, `restricted area`, `prep restricted area`, `king pushable`, and `bishops further`. The replacement order immediately after `phase 2 wall` is `rule z`, `rule y`, `rule x`, `rule w`, then `rule v`. `unclutter bishops`, `king closer`, and the Phase 1 `check` fallback remain after the new rules.

## Phase 1 target square

Find the board corner or tied corners closest to Black's king by squared Euclidean distance. For each such corner, inspect the on-board squares adjacent to Black's king and retain the square or tied squares furthest from that corner, again by squared Euclidean distance. The union is the Phase 1 target-square set.

This definition is D4 symmetric. Ties remain equivalent instead of being broken by square name or enumeration order.

The help notes rename `Target corner` to `Phase 2 Target Corner` and add:

> Phase 1 Target Square: The square adjacent to Black's king furthest from the corner closest to Black's king.

## Rule scoring

All five rules apply only to positions that start in Phase 1.

1. `rule z` prefers a non-checking result in which either bishop has a clear line to any target square. When White's king already controls a target square in the starting position, rules z through w are inactive so rule v governs that branch.
2. `rule y` prefers a result in which the bishops control the target and at least two Black-king-adjacent squares in total. The target counts as one of those adjacent squares. Results that do not reach two are ordered by the number controlled, so partial progress remains useful.
3. `rule x` applies only to candidates that move a bishop attacked by Black's king in the starting position. Among those candidates it maximizes diagonal travel length. Other candidate types remain untouched at this priority.
4. `rule w` minimizes White's resulting squared Euclidean distance to the nearest target square. Bishop moves preserve the current king distance, so a king move wins only when it makes genuine progress.
5. `rule v` activates when White's king controls a target square in the starting position. It prefers a checking result where the moved bishop does not finish on a target square.

The exact visible help text is the text supplied for rules z through v.

## Implementation and tests

Remove the old cage/confinement score fields and helpers when no longer used. Add target-square context computed once per source FEN and result-position scores for the five rules. Update the independent priority-pipeline test, score-shape assertions, rule metadata, help rendering, and focused D4-symmetry/behavior regressions.

Run TypeScript, lint, diagram validation, and the Two Bishops/presentation test suites. Then find and independently validate a fresh Phase 1 loop, treating entry into Phase 2 as termination, and open that loop on the Phase 1 server.
