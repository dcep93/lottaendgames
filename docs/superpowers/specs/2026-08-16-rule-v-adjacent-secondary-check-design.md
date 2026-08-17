# Rule V Adjacent Secondary Check

## Goal

Correct Rule V so a prepared primary squeeze diagonal recognizes a check from either immediately adjacent parallel diagonal.

## Behavior

Rule V remains Phase 1-only and keeps its existing priority and rendered wording.

When a starting bishop already controls a primary squeeze diagonal, a candidate satisfies Rule V when:

1. a bishop move checks Black;
2. the moved bishop finishes on either diagonal immediately adjacent and parallel to that primary diagonal; and
3. a resulting bishop continues to control the prepared primary diagonal.

The existing setup branch remains unchanged: when no primary diagonal is prepared, secondary reachability and resulting primary control must still belong to one Black-side squeeze bundle.

In `8/3B4/3B4/8/8/1k1K4/8/8 w - - 0 1`, the bishop on `d6` controls the primary diagonal. `Be6+` checks from an adjacent parallel diagonal while preserving `Bd6`, so it receives Rule V credit. `Bc7` does not check and receives a Rule V penalty.

## Verification

- `Be6+` is uniquely ideal in the supplied position and the reason is Rule V.
- The result is preserved under all board rotations and reflections.
- Existing Rule V setup, prepared-check, same-flank, and Phase 2 exclusions remain intact.
- Rule S, Rule T, Rule U, Rule W, king closer, Black's reply policy, phase detection, rendered text, and diagrams do not change.
- Focused tests, presentation tests, diagram drift, lint, build, and `git diff --check` pass.
- Find and open a strict Phase 1 loop, treating any transition into Phase 2 as termination.

## Scope

Do not redefine shared squeeze geometry or add position-specific exceptions. Change only Rule V's prepared-primary check matching and its tests.
