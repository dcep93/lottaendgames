# Two Bishops Rule UU Design

## Goal

Add a Phase 1 cohesion priority immediately before Rule U:

> **rule uu** — Phase 1: The bishop colored opposite to Black's king's square should control squares adjacent to the other bishop.

## Scoring

Score the resulting position after each candidate White move. Determine the color of Black's king square, then select the White bishop standing on the opposite square color. The other White bishop is the adjacency anchor.

Enumerate every on-board king-adjacent square around the anchor bishop, including orthogonal and diagonal neighbors. Count the distinct squares controlled by a clear diagonal ray from the selected bishop. A blocker stops control, and the selected bishop's occupied square does not count if it is adjacent to the anchor.

Rule UU prefers the greatest controlled-square count. Tied candidates continue to Rule U. The rule applies only to Phase 1 result positions.

## Integration

Add the Rule UU diagnostic count to `TwoBishopsWhiteMoveScore`. Register the visible priority immediately before Rule U without changing Rule U, Phase 2 behavior, or any earlier Phase 1 priority.

## Verification

Add direct scoring, comparison, priority-order, D4 rotation/reflection, rendered-help, and score-shape coverage. Run the full Two Bishops and presentation test suites, TypeScript, lint, diagram validation, and `git diff --check`. Then find and open a fresh minimal Phase 1 loop on port 5173, treating entry into Phase 2 as termination.
