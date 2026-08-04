# Two Bishops Relative Degenerate King Sidestep

## Goal

Treat the supplied Phase 1 formation as a degenerate Two Bishops position and recommend the geometric equivalent of `Kg4` whenever that king move is legal.

## Geometry

The matcher is translation-invariant and D4-symmetric. In a canonical orientation:

- White's king is on `f4`.
- Black's king is on `f2`, two cardinal squares toward the constrained side.
- One bishop is on `f5`, directly behind White's king away from Black.
- The other bishop is on `e5`, beside that bishop and diagonally behind White's king.
- The repair target is `g4`: White's king sidesteps one square away from the diagonally offset bishop.

The same relative offsets match anywhere on the board and under every rotation or reflection. Board edges and absolute squares are not part of the definition.

## Rule Integration

Add this family to the existing `degenerate` priority. Check it before the Phase 2 gate so it can activate in Phase 1. Keep every existing degenerate family Phase-2-only and otherwise unchanged.

Return the exact king origin and target only when the target move is legal. The universal `mate`, `pieces safe`, and `no stalemate` priorities remain earlier and authoritative. Do not add a new visible rule, diagram, phase definition, or fallback preference.

## Verification

- Assert that the supplied position uniquely recommends `Kg4` for `degenerate`.
- Assert translated examples and all D4 orientations select the corresponding sidestep.
- Assert nearby non-matching geometry and an unavailable target do not activate this family.
- Assert the existing four-ply `Ke4 Ke2 Kf4 Kf2` cycle is broken.
- Preserve the existing degenerate tests.
- Run focused Two Bishops degenerate, symmetry, ordering, and presentation checks; targeted TypeScript and diff checks only.
- Find and verify one current localhost loop after the policy change.

## Scope

No changes to existing rendered copy, diagrams, other Two Bishops priorities, other endgames, the full mate suite, commits, pushes, deployments, or exhaustive loop validation.
