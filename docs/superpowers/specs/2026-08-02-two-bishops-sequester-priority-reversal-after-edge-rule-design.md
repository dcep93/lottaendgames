# Two Bishops: Reverse Sequester Preferences

## Goal

Reverse Sequester's two preference comparisons without weakening its mandatory edge confinement.

## Policy

Sequester remains a Phase 2 rule with these ordered comparisons:

1. Ensure every legal Black reply remains on the edge.
2. Keep White's king closer to the square a knight's move from Black's proximate corner.
3. Force Black's king toward the corner proximate to White's king.

Rendered text:

> **sequester** — Phase 2: Ensure Black cannot leave the edge. Prefer keeping White's king closer to the square a knight's move from the corner, then prefer forcing Black's king towards White's king's proximate corner.

No score definitions, phase behavior, or other priorities change.

## Verification

Update focused ordering and example assertions, then run the focused Two Bishops tests, directly affected presentation tests, app TypeScript, diff hygiene, and the root-local fail-fast loop finder. Validate the resulting replay link in the localhost app. Do not run the full mate suite.

## Constraints

- Stateless and D4 symmetric.
- Exact rendered/mechanical alignment.
- Preserve unrelated dirty work.
- No commit, push, deploy, or full mate suite.
