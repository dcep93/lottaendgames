# Two Bishops Graph Removal and Rule X Design

## Goal

Remove the obsolete runtime mate-pattern graph so Two Bishops initialization no longer spends roughly 2.5 seconds rebuilding legacy flows, and add Rule X as the last visible White priority.

## Runtime simplification

- Remove eager graph initialization from `MateWorkspace`.
- Remove the graph-backed hidden `prepare mate` override from White move selection and ordinary move scoring.
- Delete the obsolete graph implementation and its dedicated tests.
- Retain the Phase 2 training FEN constants used by the mate catalog.
- Remove obsolete mate-pattern help-board construction that is discarded by the current help filter.
- Phase 2 remains defined exclusively by eligible functional bishop-wall geometry.

## Rule X

Rule text:

> **rule x** — Phase 2: Force Black's king towards the corner, preferring checks.

Rule X appears after Rule W and therefore breaks only ties left by every earlier priority.

When the starting position is Phase 2, determine the corner or corners belonging to its tightest eligible bishop wall. A candidate White move satisfies Rule X only when Black has at least one legal reply and, for at least one such wall corner, every legal Black reply strictly reduces the Black king's Chebyshev distance to that corner. This all-replies condition is the primary comparison. Among moves with the same result, checking moves rank above non-checking moves. A check that fails the all-replies condition cannot outrank a non-check that satisfies it. Mate and stalemate remain governed by the earlier safeguards.

## Verification

- Test the visible rule order and Rule X text.
- Test strict all-replies behavior under rotations and reflections.
- Test that checks break ties between qualifying Rule X moves without overriding the all-replies condition.
- Run focused Two Bishops tests, build, lint, and diff checks.
- Re-measure cold initialization to confirm the graph construction cost is gone.
- Find, independently validate, and load an h1-oriented loop at `cursor=0`.
