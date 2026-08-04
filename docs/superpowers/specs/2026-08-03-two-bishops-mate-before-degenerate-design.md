# Two Bishops: mate before degenerate

## Change

- Move `mate in 3` immediately above `degenerate` in the visible and mechanical White priority order.
- Define Phase 2 as: `Black's king forced to the edge, White's king not on an edge or adjacent to Black's edge.`
- Apply the same White-king restriction to `force phase 2` candidate scoring.

The phase classifier remains current-position-only and D4 symmetric. Verification is limited to focused Two Bishops and presentation tests, diagram consistency, TypeScript, diff checking, and the fail-fast loop runner. No browser validation.
