# Two Bishops Phase 1 Bishop Control Design

## Goal

Add a visible `bishop control` priority to the Two Bishops Phase 1 policy immediately before `king closer`:

> Phase 1: Prefer a bishop to control a square adjacent to Black's king but not adjacent to White's king.

Adjacency includes orthogonal and diagonal neighbors.

## Behavior

The priority evaluates the position resulting from each legal White move. A candidate receives no penalty when either White bishop has a clear diagonal line to at least one board square that:

- is one king step from Black's king;
- is more than one king step from White's king; and
- is not occupied by the controlling bishop itself.

The comparison is binary. Controlling one qualifying square is sufficient; additional qualifying squares do not improve the score. Because the resulting position is evaluated rather than the moving piece, an existing useful control may be preserved by either a bishop move or a king move.

The rule applies only when the starting position is Phase 1. It is ordered after `start wall` and before `king closer`, so all earlier safety, tactical, conclave, and wall priorities retain precedence.

## Implementation

Add a `bishopControlPenalty` field to `TwoBishopsWhiteMoveScore`. Compute the qualifying squares from the unchanged Black king and the resulting White king, then use the existing clear-bishop-line helper against the resulting board. Add an ordered rule with `applies: !isPhaseTwoPosition` and a direct penalty comparison.

Expose the new label and help text through the existing generated white-rule descriptions.

## Verification

Tests will cover:

- the rule's exact order and help text;
- diagonal as well as orthogonal adjacency to Black's king;
- exclusion of squares diagonally or orthogonally adjacent to White's king;
- clear-line bishop control in the resulting position;
- binary scoring rather than maximizing the number of controlled squares;
- inactivity in Phase 2; and
- D4 symmetry through transformed representative positions.

Run the focused Two Bishops and presentation tests, then search the Phase 1 verifier for a replay-seeded loop on the worktree server at `127.0.0.1:5174`.
