# Two Bishops Resulting Target Corner Design

## Goal

Derive the target corner from the cage White creates, rather than from every isolated edge square attacked by a bishop.

## Definition

Calculate the target after each candidate White move.

1. A two-square wall is two adjacent squares on Black's current edge, with each square controlled by a different bishop.
2. If such a wall exists and every legal Black reply remains on that edge and moves in the same along-edge direction, the target is the corner in that direction.
3. Otherwise, the target is the corner on Black's edge closest to White's resulting king square.
4. If the fallback distances tie, both corners remain valid targets. Target-sensitive comparisons must not choose an arbitrary orientation.

Checkmate and stalemate candidates may have no Black replies; universal priorities decide those moves before target-sensitive rules.

## Architecture

- Replace the source-position `getTargetCorner` value with a candidate-result target-corner set.
- Detect wall control geometrically from the resulting board and require distinct bishops.
- Determine forced direction from all legal Black king replies, not from Black's preferred reply policy.
- Score `sequester`, `bishops away`, and `phase 2 wall` against the resulting target set. Because candidates may have different targets, `sequester` compares forced progress toward each candidate's own target rather than raw distance to different corners.
- Keep phase classification, rule order, rendered strategic rules, and move-history independence unchanged.
- Update the rendered target-corner note to match the new mechanic.

## Verification

- The reported `8/8/8/8/8/4BB1k/5K2/8 w - - 2 2` position must not select `h8` because of isolated `h1` control.
- Add fixtures for forced movement toward both ends of every edge through D4 transforms.
- Add a no-wall fallback fixture and an exact-tie fixture.
- Run focused Two Bishops rules, directly affected presentation, TypeScript, diagrams, diff checks, and the small fail-fast loop gate.

## Non-goals

- No deeper search or proof-distance lookup.
- No move history or previous-position input.
- No unrelated change to Phase 2 or Black's resistance policy.
