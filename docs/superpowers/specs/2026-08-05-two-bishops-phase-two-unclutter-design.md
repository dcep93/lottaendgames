# Phase 2 Unclutter Bishops Design

## Goal

Limit `unclutter bishops` to Phase 2 and make its guide text state that scope explicitly.

## Behavior

The rule remains after `phase 2 wall` and keeps its existing comparison: prefer fewer bishops within two king steps of any corner. It applies only when the candidate move's resulting position is Phase 2, following the existing phase-gating convention used by nearby Two Bishops rules.

The visible help text becomes:

> Phase 2: Prefer bishops more than two king steps from a corner.

Phase 1 candidates bypass this rule and continue directly to the Phase 1 cage priorities.

## Implementation

- Add a Phase 2 applicability predicate to the registered rule.
- Update the independent ordered-rule pipeline to apply the unclutter filter only in Phase 2.
- Update guide-copy expectations.
- Add explicit coverage that the rule is active in Phase 2 and inactive in Phase 1 while preserving its existing metric and symmetry tests.

## Verification

Run the focused Two Bishops and presentation tests, TypeScript, lint, and diagram freshness checks. Then find and open a current loop whose positions remain in Phase 1; reaching Phase 2 is treated as termination during loop search.

## Boundaries

- Do not change the corner-distance metric.
- Do not reorder the rule.
- Do not change Phase 2 detection.
- Do not modify the main worktree.
