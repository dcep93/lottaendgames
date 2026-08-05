# Two Bishops: Unconditional Target Score

## Goal

Remove the opposition requirement from Phase 2 target-corner scoring.

## Definition

Calculate after every candidate White move in Phase 2.

1. Use the coordinate axis running along Black's current edge.
2. For each candidate corner, count bishops strictly beyond White's king toward the opposite corner.
3. Choose the corner or tied corners with the greatest count.
4. If the scores tie, choose the corner or tied corners with the smallest Chebyshev distance from White's king.
5. If proximity also ties, retain both corners.

If Black is already in a corner, that corner remains the only candidate. Bishops sharing White's king's edge-axis coordinate do not contribute to either corner's score. Target selection does not use opposition, a bishop wall, Black's reply direction, a king race, move history, or search.

## Rendered note

Render exactly:

> Target corner: Calculate after White's move in Phase 2. Score each corner by the number of bishops beyond White's king toward the opposite corner, along Black's edge. Choose the higher score. Otherwise, and to break a score tie, choose the corner closest to White. Retain both corners if still tied.

## Examples

- In `2k5/8/2BK4/8/3B4/8/8/8 w - - 2 2`, Ba7 leaves both bishops left of White's king along the eighth-rank axis, so h8 scores 2 and becomes the target despite the kings being a knight's move apart.
- The previous Bg7 and Bg3 examples retain their 2–0 and 1–1 scores respectively.

## Verification

Focused D4 tests will prove Ba7 selects h8 without opposition, preserve the Bg7/Bg3 examples, and verify tied proximity. Update the rendered-note assertion, run TypeScript, diagram, and diff checks, then return one refreshable all-Phase-2 cycle.

