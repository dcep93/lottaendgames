# Two Bishops Target-Corner King Race

## Goal

Make the Phase 2 target corner follow the kings' geometry instead of the bishops' placement. In `8/8/8/4BB2/8/4K3/8/3k4 w - - 6 4`, both `Bg3` and `Bb2` must target `h1`, after which the later `phase 2 wall` rule uniquely prefers `Bb2`.

## Selection

Calculate the target after each candidate White move, using the two corners on Black's current edge.

1. Measure each king's Chebyshev distance to each corner.
2. A corner qualifies when White's king is strictly closer than Black's king.
3. Among qualifying corners, retain the corner or corners with the greatest race lead: Black distance minus White distance.
4. If no corner qualifies, retain the corner or corners closest to White's king.
5. Retain exact ties so later visible rules can decide.

Bishop placement does not participate in target-corner selection. The existing sequester rule continues to measure Black's forced progress toward the selected corner and its two-away control fallback.

## Presentation

Replace the target-corner note with a concise mechanical description of the king-race calculation and its fallback. No new visible priority is added.

## Tests

- The supplied position targets `h1` after both `Bg3` and `Bb2`, with `Bb2` uniquely recommended by the later wall rule.
- The selector and recommendation remain D4 symmetric.
- Exact race ties retain both corners.
- Positions where neither corner is won fall back to the corner closest to White.
- Existing focused Two Bishops, presentation, diagram, and TypeScript checks remain green.

## Scope

The policy remains stateless and current-board-only. This change does not alter phase classification, Black's policy, degenerates, universal rules, or the definition of a Phase 2 wall.
