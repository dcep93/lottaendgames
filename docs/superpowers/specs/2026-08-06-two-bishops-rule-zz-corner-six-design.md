# Two Bishops Rule ZZ: Corner Six

## Goal

Add this visible comparison immediately before Rule Z:

`rule zz — Phase 1: Keep bishops out of the corner 6 squares.`

In canonical a1 orientation, the forbidden six squares are `a1`, `a2`, `a3`, `b1`, `b2`, and `c1`.

## Scoring

For each resulting position, count White bishops that occupy the six-square triangle at any of the four corners. A square belongs to a corner triangle when its Manhattan distance from that corner is at most two. This produces the canonical set and its rotations/reflections without a duplicated square table.

Prefer fewer bishops in the union of those four corner triangles. Zero beats one, and one beats two. Rule ZZ applies to every Phase 1 survivor and is inactive in Phase 2.

## Priority and Presentation

Place Rule ZZ directly after `phase 2 wall` and before Rule Z in the visible rule list and comparison pipeline. Render the help text exactly as:

`Phase 1: Keep bishops out of the corner 6 squares.`

## Verification

- Assert the canonical six squares and all rotations/reflections are counted.
- Assert nearby non-corner-six squares are excluded.
- Assert zero, one, and two bishops rank in that order.
- Assert Rule ZZ can decide a Phase 1 recommendation before Rule Z.
- Assert it is inactive in Phase 2.
- Update the explicit rule order, score-shape, public batch, and presentation expectations.
- Run the complete Two Bishops rules test, presentation test, TypeScript build, lint, and diagram drift check.
