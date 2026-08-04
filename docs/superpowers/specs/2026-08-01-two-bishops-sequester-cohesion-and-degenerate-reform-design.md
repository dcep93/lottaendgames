# Two Bishops Sequester Cohesion and Phase 1 Degenerate Reform

## Goal

Add bishop cohesion as Sequester's last preference and treat the supplied Phase 1 formation as a degenerate position whose exact repair is the geometric equivalent of `Bf4`.

## Sequester

Append a fourth subpriority after edge confinement, forcing Black toward White's proximate corner, and White-king corner support. The new subpriority minimizes the Chebyshev distance between the two bishops after White's move. Orthogonal and diagonal adjacency therefore both count as a one-square separation.

Render:

> **sequester** — Phase 2: Ensure Black cannot leave the edge. Prefer forcing Black's king towards White's king's proximate corner, then prefer keeping White's king closer to the square a knight's move from the corner, then prefer keeping White's bishops closer.

## Phase 1 Degenerate Reform

Add an exact translation-invariant, D4-symmetric relative template centered on White's king. In the supplied orientation:

- Black's king is at relative offset `(-2,-2)`.
- The stationary bishop is at `(-1,+1)`.
- The moving bishop is at `(-2,+1)`.
- The repair moves the latter bishop to `(-1,0)`, producing `e5-f4` (`Bf4`).

Try this template as a second Phase 1 degenerate family after the existing king-sidestep family. Return the exact bishop origin and target only when that move is legal. Keep all existing Phase 2 degenerate families unchanged.

## Implementation Shape

Reuse one common set of eight relative D4 transforms for the existing Conclave matcher and the new degenerate matcher. Keep Sequester's bishop-distance score mechanically owned by its rendered fourth subpriority. Add no new visible rule, diagram, phase definition, lookup, history dependency, or fallback preference.

## Verification

- Assert Sequester's fourth score and rendered order.
- Assert earlier Sequester subpriorities still dominate bishop cohesion.
- Assert the supplied position uniquely recommends `Bf4` with reason `degenerate`.
- Assert translated examples and every D4 transform select the corresponding bishop reform.
- Assert nearby relative geometry does not activate it and every accepted transformed repair is legal.
- Preserve existing Phase 1 and Phase 2 degenerate regressions.
- Run focused degenerate, Sequester, ordering, symmetry, presentation, TypeScript, and diff checks only.
- Find and verify a current localhost loop after the policy changes.

## Scope

No full mate suite, global SCC census, exhaustive search, unrelated endgame tests, commit, archive synchronization, push, or deployment.
