# Two Bishops Mate-Prep Access Design

## Goal

Restrict `degenerate — mate prep` to positions where the bishops can prepare the required mating diagonals in one legal bishop move. The existing king stencil, Phase 2 requirement, D4 symmetry, and forced king move remain unchanged.

## Eligibility

Use the supplied h1-side orientation as the canonical mate-prep position: Black h2, White f3, with Kf2 as the repair. Evaluate it and every D4-equivalent orientation:

- the light-squared bishop must have at least one legal move to the transformed d1–h5 diagonal;
- the dark-squared bishop must have at least one legal move to the transformed c1–h6 diagonal.

Legal reachability includes board blockers. A bishop already on its required diagonal qualifies only when it has a legal move to another square on that diagonal. The matcher remains stateless and board-position-only.

## Behavior

When both access conditions and the existing king stencil hold, mate prep keeps its current terminal repair. Otherwise it does not activate and the position cascades to later visible rules such as `sequester`.

The mate-prep diagram uses this canonical orientation and shows bishops that satisfy both access requirements, so the presentation and matcher share the same geometry.

## Verification

- Preserve the canonical mate-prep diagram under every D4 transform.
- Preserve a non-diagram bishop placement that has legal one-move access to both diagonals.
- Reject the supplied loop position because its light-squared bishop cannot access d1–h5 in one move.
- Assert the supplied position is then owned by `sequester`.
