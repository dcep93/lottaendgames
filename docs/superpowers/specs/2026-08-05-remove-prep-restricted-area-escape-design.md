# Remove Prep Restricted Area Escape Design

## Goal

Remove the attacked-bishop diagonal-maintenance and farthest-travel behavior from `prep restricted area`.

## Behavior

`prep restricted area` retains only its fallback for positions where no restricted area can be formed: control a square diagonally adjacent to Black's king, preferring squares closer to the center.

The visible help text becomes:

> Phase 1: Bishop control a square diagonally adjacent to Black's king, preferring squares closer to the center of the board.

When candidate moves already maintain the same restricted area, this rule no longer distinguishes attacked bishops, diagonal preservation, or travel length. Lower priorities decide those ties.

## Implementation

- Remove the attacked-bishop boundary context and score fields.
- Remove the first `prep restricted area` subpriority.
- Keep the center-oriented fallback subpriority unchanged.
- Simplify the independent expected-policy pipeline.
- Replace the farthest-travel tests with coverage that the supplied `Bc5` position falls through to lower priorities.

## Verification

Verify the supplied position, D4 symmetry, the Two Bishops and presentation tests, TypeScript, lint, and diagram freshness. Then find and open a current Phase 1 loop, treating every transition to Phase 2 as termination.

## Boundaries

- Do not change restricted-area scoring.
- Do not change the remaining center-oriented fallback.
- Do not reorder surrounding rules.
- Do not modify the main worktree.
