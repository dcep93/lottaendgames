# Two Bishops Adjacent Bishops Design

## Goal

Replace six specialized Phase 1 priorities with one general rule:

> **adjacent bishops** — Phase 1: Place the bishops on adjacent diagonals, then adjacent squares

Remove the standalone `knight-step control`, `conclave step`, `reverse conclave step`, `martian conclave step`, `finish wall`, and `start wall` rules. Keep Phase 2 behavior and `degenerate — knight-step control` unchanged.

## Geometry

Score the two bishops in the position after White's candidate move.

A board square has two diagonal-line indices: `file + rank` and `file - rank`. The bishops occupy adjacent parallel diagonals when the absolute difference between either pair of same-direction indices is one. This definition is translation-, reflection-, and rotation-invariant.

The rule has two ordered subpriorities:

1. Prefer results where the bishops occupy adjacent parallel diagonals.
2. Once every surviving result has adjacent diagonals, prefer results where the bishop squares are adjacent by Chebyshev distance one.

Both subpriorities are binary. If no candidate satisfies a stage, that stage retains every move so later priorities can decide. Because legal opposite-color bishops cannot be diagonally adjacent, adjacent bishop squares are orthogonally adjacent in normal Two Bishops positions.

All legal White moves are scored, including king moves. A king move therefore preserves an already-correct bishop formation instead of losing merely because it did not move a bishop.

## Policy Order

Place `adjacent bishops` immediately after `phase 2 wall` and before `king closer`. It applies only when the starting position is Phase 1.

The visible sequence around the replacement is:

1. `phase 2 wall`
2. `adjacent bishops`
3. `king closer`
4. `check`

Earlier mate, safety, degenerate, and Phase 2 priorities remain unchanged.

## Removal Scope

Remove the obsolete score fields, position-context fields, geometric detectors, ordered-rule entries, guide text, generated diagram data, generator output, and dedicated tests for the six replaced rules.

Remove the four note boards belonging to `knight-step control`, `conclave step`, `reverse conclave step`, and `martian conclave step`. `finish wall` and `start wall` have no dedicated note boards. Do not add a new diagram for `adjacent bishops`.

Historical design documents remain in the repository. Unrelated degenerate repairs, the proximate-wall explanatory board, Phase 2 wall logic, and Phase 2 policy remain intact.

## Verification

Tests must establish that:

- the visible rule list contains `adjacent bishops` and none of the six removed IDs;
- adjacent diagonals are preferred before adjacent squares;
- king moves can preserve an established formation;
- the rule is inactive in Phase 2;
- the geometry follows translations and every D4 transform;
- removed score fields, help copy, note boards, and generated diagram entries are absent;
- the full focused Two Bishops and presentation suites pass;
- diagram consistency, lint, and production build pass;
- a strict current-policy loop remains entirely in Phase 1 and treats entry to Phase 2 as termination.

