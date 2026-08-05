# Two Bishops: Winning-Race Target Fallback

## Goal

Choose h1 as the target corner in `8/8/8/8/8/2B2BK1/8/6k1 w - - 2 2` without losing the earlier a8 target selected when White genuinely wins that corner race.

## Definition

Calculate the target corner from the position after each candidate White move.

1. If a valid two-square wall forces every Black reply along the edge in one direction, use the corner in that direction.
2. Otherwise, calculate Chebyshev distance from each king to each corner on Black's edge. If White can reach at least one corner in fewer steps than Black, retain the corner or tied corners with White's largest lead.
3. If White wins neither corner race, retain the corner or tied corners with the smallest raw Chebyshev distance from White's king.
4. If a tie remains, keep the existing nearest-wall cage tie-break and retain both corners if still tied.

For the requested position, White wins neither race. White is two steps from h1 and six from a1, so h1 is the target. In the earlier a8 regression, White reaches a8 sooner than Black, so a8 remains the target.

## Scope

Only the board-derived, post-move target-corner fallback changes. Sequester scoring, wall detection, priority order, rendered target-corner note, statelessness, and D4 symmetry remain mechanically aligned. The rendered note must be updated to describe the new fallback exactly.

## Verification

Focused tests will prove h1 for the requested position under all D4 transforms, preserve the earlier a8 target under all D4 transforms, check the updated rendered note, and run targeted TypeScript, diagram, and diff checks. The final handoff will include one refreshable cycle whose complete boundary remains in Phase 2.

