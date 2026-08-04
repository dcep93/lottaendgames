# Two Bishops sequester bishop distance

## Goal

Add a final, visible subpriority to `sequester`:

> Phase 2: Ensure Black cannot leave the edge. Prefer forcing Black's king towards White's king's proximate corner, then prefer keeping White's king a knight's move from the corner, then prefer keeping the bishops farther from the kings.

## Metric

Evaluate the board immediately after White's candidate move. For each bishop, calculate its squared Euclidean distance to White's king and Black's king, retain the smaller value, and add the two retained values. A larger sum is better.

This rewards both bishops for staying away from whichever king is nearer without allowing one very distant bishop to conceal another bishop next to a king. The metric is board-position-only and D4 symmetric.

The new comparison is the fourth and final sequester subpriority. It runs only after edge confinement, Black's worst reply distance to White's proximate corner, and White's king distance to a corner knight square all tie.

## Verification

- Add a focused fixture where the first three sequester values tie and the summed-nearest bishop distance uniquely decides the move.
- Assert the exact visible text and four-subpriority architecture.
- Retain position-only and D4 symmetry coverage.
- Run focused Two Bishops rule and presentation tests, TypeScript, and diff validation.
- Run the fail-first Two Bishops loop finder and validate a refreshable localhost cycle.
