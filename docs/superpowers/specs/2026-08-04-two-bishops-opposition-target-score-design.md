# Two Bishops: Opposition Target Score

## Goal

Replace the target-corner calculation completely with a Phase 2, post-White-move rule based on direct king opposition, bishop placement along Black's edge, and White-king proximity.

## Definition

Calculate after every candidate White move in Phase 2.

1. If Black is already in a corner, that corner is the only target.
2. If the kings are in direct opposition, use the coordinate axis running along Black's current edge. For each candidate corner, count bishops strictly beyond White's king toward the opposite corner. Choose the corner or tied corners with the greatest count.
3. If the kings are not in direct opposition, or the bishop counts tie, choose the corner or tied corners with the smallest Chebyshev distance from White's king.
4. If proximity also ties, retain both corners.

Bishops sharing White's king's edge-axis coordinate do not contribute to either corner's score. Target selection does not use a bishop wall, Black's reply direction, a king race, move history, or any lookup/search result.

## Examples

Starting from `6B1/8/8/4BK1k/8/8/8/8 w - - 0 1`:

- After Bg7, both bishops are above White's king. h1 scores 2 because both bishops lie beyond White's king toward the side opposite h1; h1 is the target.
- After Bg3, one bishop is above White's king and one is below. h1 and h8 each score 1, so the proximity tie-break selects h8.

## Rendered note

> Target corner: Calculate after White's move in Phase 2. When the kings are in opposition, score each corner by the number of bishops beyond White's king toward the opposite corner, along Black's edge. Choose the higher score. Otherwise, and to break a score tie, choose the corner closest to White. Retain both corners if still tied.

## Verification

Focused D4 tests will prove the two supplied examples, non-opposition proximity, retained ties, and independence from wall direction. Update the directly affected presentation assertion, run TypeScript, diagram, and diff checks, then return one refreshable all-Phase-2 cycle.

