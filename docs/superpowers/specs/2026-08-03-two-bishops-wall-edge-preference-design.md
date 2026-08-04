# Two Bishops Wall Edge Preference

## Goal

Prefer a Phase 2 bishop wall away from the board edge, restore `king closer` to
Phase 1, and remove `take opposition`.

## Design

- Render `phase 2 wall` as: “Phase 2: Create or maintain a 2 square wall not on
  the same side as the white king, preferring non edge squares.”
- Express the rule as two visible-text-aligned comparisons: first prefer a valid
  Phase 2 wall; among tied candidates, minimize the number of bishops occupying
  edge squares. Zero edge bishops beats one, and one beats two.
- Render `king closer` as: “Phase 1: Bring White's king as close as possible to
  Black's king.” Activate it only in Phase 1.
- Remove `take opposition` from the visible priorities and delete its score,
  comparison, rendered copy, and exclusive helper.

For `5k2/2B5/2B2K2/8/8/8/8/8 w - - 26 14`, `Bd8` and `Bd6+` both satisfy the
wall geometry, but `Bd6+` is uniquely preferred because it leaves no bishop on
an edge.

## Verification

- Add an exact regression for unique `Bd6+` and the `phase 2 wall` reason.
- Update rule-order, score-shape, and rendered-copy assertions.
- Retain focused symmetry, statelessness, legality, mate, stalemate, safety, and
  wall-geometry checks.
- Run targeted TypeScript, Two Bishops rules, presentation, diagrams, diff, and
  fail-fast loop verification only.

