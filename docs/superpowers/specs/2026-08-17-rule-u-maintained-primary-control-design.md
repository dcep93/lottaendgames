# Rule U Maintained Primary Control Design

## Scope

Correct Rule U so an already controlled primary squeeze diagonal can satisfy its one-move primary-control condition when the controlling bishop has a legal move that maintains that diagonal.

## Scoring

Rule U continues to require:

- kings a knight's move apart in the starting position;
- a candidate king move that takes opposition;
- one bishop on the resulting secondary squeeze diagonal; and
- a distinct bishop with a legal move that controls the matching primary squeeze diagonal.

The final condition accepts both a bishop moving onto the primary diagonal and a bishop moving along a primary diagonal it already controls. Existing control alone is insufficient if the bishop has no legal move that maintains the diagonal.

In `8/8/5B2/5B2/8/5K2/7k/8 w - - 34 18`, `Kf2` takes opposition. The f6 bishop controls the secondary diagonal, and the f5 bishop already controls and can legally move along the matching primary diagonal. `Kf2` is therefore uniquely correct under Rule U.

## Implementation

Rename the primary reachability helper to describe moving to control rather than moving onto an unoccupied diagonal. Remove its exclusion for bishops already on the requested diagonal while preserving its legal empty-target and clear-line requirements.

Do not change Rule U's rendered English, order, phase scope, or squeeze geometry.

## Verification

- Add the supplied Phase 2 `Kf2` regression and D4 symmetry coverage.
- Preserve the distinct-bishop requirement and the negative screened/same-color cases.
- Add or retain a negative case where existing primary occupancy has no legal maintaining move if naturally available.
- Run the focused rules and presentation suites, lint, build, and diagram consistency check.
- Find and open a strict Phase 1 loop, treating entry into Phase 2 as termination.
