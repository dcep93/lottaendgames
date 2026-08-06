# Two Bishops Degenerate Middleish Targets A and B

## Goal

Rename the existing `degenerate — middleish target` repair to `degenerate — middleish target a`, preserving its exact behavior. Add `degenerate — middleish target b` for:

`8/8/3K4/3BB3/8/3k4/8/8 w - - 14 8`

Target B makes `Kc5` uniquely correct instead of falling through to Rule W.

## Matching

Both repairs are Phase 1-only exact piece-geometry matchers under all eight board rotations and reflections. Neither repair matches translations or nearby arrangements.

Target A retains its canonical geometry and e5-to-d6 king move.

Target B uses this canonical geometry:

- Black king: d3
- White king: d6
- White bishops: d5 and e5
- White target: c5

Each transformed target move must be legal.

## Priority and Presentation

Register Target A immediately before Target B, with both before `degenerate — phase 1 loop escape`. Rename Target A's reason, diagram title, identifier, caption, generated-position key, tests, and output label. Add equivalent Target B presentation data with an arrow from d6 to c5.

## Verification

- Preserve Target A's unique move and all D4 transforms under its new label.
- Assert that Target B uniquely selects `Kc5` in the supplied Phase 1 position.
- Assert Target B's transformed move for every D4 symmetry.
- Assert both repairs reject translations and nearby arrangements and remain inactive in Phase 2.
- Verify both generated diagrams and guide rendering.
- Run the Two Bishops rule tests, presentation tests, TypeScript build, lint, and diagram drift check.
