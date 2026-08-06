# Two Bishops Rule Y: Common-Adjacent Squares

## Goal

Correct rule y to implement the intended parenthesized meaning while preserving its rendered text:

> Phase 1: Use a bishop to control the two squares adjacent to Black's king and also the target square.

The intended squares are those adjacent to both Black's king and the Phase 1 target square.

## Design

For each Phase 1 target square, intersect its king-neighbor squares with Black's king-neighbor squares. Score each resulting White bishop independently by the number of those common-adjacent squares it controls, capped at two. Rule y uses the greatest score achieved by one bishop across all tied target squares.

Rule y does not require that bishop to control the target square itself. Rule z already owns target-square control. Rule y also does not combine control from the two bishops.

In `8/4k3/8/3KBB2/8/8/8/8 w - - 36 19`, the target is `d6` and its common-adjacent squares with Black's king on `e7` are `d7` and `e6`. After `Bg4`, the bishop on `g4` controls both; after `Bc2`, neither bishop does. Therefore `Bg4` must beat `Bc2` at rule y.

Keep the guide text, rule order, target selection, rule-v fallback, rule-u scoring, and Phase 2 behavior unchanged.

## Verification

Add the supplied-position regression asserting rule-y scores of two for `Bg4` and zero for `Bc2`, with `Bg4` uniquely ideal and rule y as the hint. Preserve D4-symmetry coverage and update obsolete tests for the superseded target-control interpretation. Run focused Two Bishops and presentation tests, TypeScript, lint, and diagram validation. Finally, find and open a directly playable Phase 1 loop, treating Phase 2 entry as termination.
