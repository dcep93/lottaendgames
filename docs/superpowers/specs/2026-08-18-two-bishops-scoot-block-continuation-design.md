# Two Bishops Scoot-to-Block Continuation Design

## Goal

Prevent `boot scoot n block` from crediting a king scoot that cannot reach the maneuver's final bishop block after Black's non-moat-widening reply.

## Behavior

- Keep the evaluator position-based.
- Preserve the existing geometric recognition of candidate scoots and final blocks.
- A candidate scoot remains valid when every Black reply either widens the King moat or leaves at least one legal final bishop block.
- A moat-widening reply needs no final block because it already satisfies the moat modifier.
- Keep the rendered rule text and priority order unchanged.

## Regression

For `8/8/8/8/3K4/6BB/4k3/8 w - - 2 2`, `Ke4` must not satisfy `boot scoot n block`: after `...Kd2`, no final block is available and the original Rule U position repeats.

The valid GIF continuation `Kc4 ...Kd2 Bc5` must remain accepted; `...Kb1` is allowed as a moat-widening alternative.

## Verification

- Add a focused regression for the cyclic `Ke4` scoot.
- Preserve all existing boot-scoot-block, symmetry, Phase 2, and presentation tests.
- Run the full app checks.
- Find and open a fresh strict Phase 1 loop, treating Phase 2 as termination.
