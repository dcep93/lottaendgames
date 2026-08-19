# Two Bishops Onsides Rule

## Goal

Add `onsides` immediately after `edge flank`:

> Move a bishop behind the moat the shortest distance to behind White's king from Black's king's perspective.

## Behavior

When knight-step or opposition king geometry defines a moat, consider bishops starting on Black's side. A qualifying bishop move must cross to White's side and finish on or beyond White's king along every coordinate axis on which the kings differ. Prefer the shortest bishop travel distance. The rule is inactive when no such move exists. For `Kd3` looking through `Ke5`, this makes `e5–h8` the valid destination subgrid.

In `1B6/8/8/2k5/4K3/8/2B5/8 w - - 0 1`, the moat is the d-file and `Bf4` is uniquely preferred.

## Verification

Test visible order and copy, the supplied position, TypeScript, focused Two Bishops behavior, and an independently replayed loop.
