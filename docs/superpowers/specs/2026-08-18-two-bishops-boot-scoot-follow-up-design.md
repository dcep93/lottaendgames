# Two Bishops Boot-Scoot Follow-Up Design

## Goal

Prevent `boot scoot n block` from crediting a bishop boot when a non-moat-widening Black reply leaves White unable to scoot into opposition on the next move.

## Behavior

- Preserve the existing boot requirement: Black must either move toward the prepared secondary squeeze diagonal or widen the King moat.
- A reply that widens the moat needs no scoot continuation because the moat modifier is satisfied.
- Every reply that moves toward the prepared secondary squeeze diagonal must leave at least one legal White king move that the existing boot-scoot geometry recognizes as a scoot into opposition.
- Keep the rendered rule text and priority order unchanged.

## Regression

For `8/8/8/8/4K3/7B/4k2B/8 w - - 2 2`, `Bf4` must not satisfy `boot scoot n block`: after `...Kf2`, the bishop on f4 occupies White's required opposition square.

## Verification

- Add a focused regression test for the supplied loop position.
- Preserve the existing GIF, waiting-line, translation, symmetry, and Phase 2 tests.
- Run the focused Two Bishops tests and full app checks.
- Find and open a fresh strict Phase 1 loop, treating Phase 2 as termination.
