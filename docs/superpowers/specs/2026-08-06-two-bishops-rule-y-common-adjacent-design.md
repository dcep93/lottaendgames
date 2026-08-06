# Two Bishops Rule Y: Common-Adjacent Squares

## Goal

Correct rule y to implement the intended parenthesized meaning and allow occupation of a required square:

> Phase 1: Use a bishop to control or occupy the two squares adjacent to Black's king and also the target square.

The intended squares are those adjacent to both Black's king and the Phase 1 target square.

## Design

For each Phase 1 target square, intersect its king-neighbor squares with Black's king-neighbor squares. Score each resulting White bishop independently by the number of those common-adjacent squares it either occupies or controls through a clear diagonal, capped at two. Rule y uses the greatest score achieved by one bishop across all tied target squares.

Rule y does not require that bishop to control the target square itself. Rule z already owns target-square control. Rule y also does not combine control from the two bishops.

In `8/8/8/4K3/8/3k4/1B4B1/8 w - - 26 14`, Black's king on `d3` and the target `e4` have common-adjacent squares `d4` and `e3`. After `Bd4`, that bishop occupies `d4` and controls `e3`, so its Rule-Y score is two.

In `8/4k3/8/3KBB2/8/8/8/8 w - - 36 19`, the target is `d6` and its common-adjacent squares with Black's king on `e7` are `d7` and `e6`. After `Bg4`, the bishop on `g4` controls both; after `Bg3`, the bishop remaining on `f5` controls both; after `Bc2`, neither bishop does. Therefore `Bg3` and `Bg4` tie at rule y, then rule u selects `Bg3` because its bishop-distance score is greater.

Keep the rule order, target selection, rule-v fallback, rule-u scoring, and Phase 2 behavior unchanged.

## Verification

Add the supplied-position regression asserting that `Bd4` scores two and is selected by Rule Y. Preserve the existing clear-line and D4-symmetry coverage, and add transformed occupation coverage. Update the rendered guide text. Run focused Two Bishops and presentation tests, TypeScript, lint, and diagram validation. Finally, find and open a directly playable Phase 1 loop, treating Phase 2 entry as termination.
