# Two Bishops: Closest-to-White Target Corner

## Goal

Simplify the board-derived target-corner fallback and its explanation.

## Definition

Calculate the target after each candidate White move:

1. If a valid two-square bishop wall beside Black forces every legal Black reply along the edge in one direction, use the corner in that direction.
2. Otherwise, choose the corner on Black's edge with the smallest Chebyshev distance from White's king.
3. If both corners are equally close to White's king, retain both.

Remove the relative king-race comparison and nearest-wall tie-break.

## Rendered note

Keep the existing forced-wall and wall-adjacency explanation, then end with:

> Otherwise, choose the corner closest to White.

## Verification

Focused D4 tests will prove raw White-king proximity, tied-corner retention, and forced-wall precedence. Historical fixtures that freeze the removed race or nearest-wall fallback will be rewritten to assert the simplified semantic rule. Run targeted presentation, TypeScript, diagram, and diff checks, then return one refreshable all-Phase-2 cycle.

