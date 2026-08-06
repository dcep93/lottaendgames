# Unclutter Bishops in Both Phases Design

## Goal

Apply `unclutter bishops` in both phases while preserving its existing metric and priority.

## Behavior

The rule prefers fewer bishops within two king steps of any corner. It has no phase gate, so it filters Phase 1 and Phase 2 candidates alike. It remains immediately after `phase 2 wall`; consequently, in Phase 1 it runs before `ideal cage`, `restricted area`, and the remaining Phase 1 strategy rules.

The visible help text becomes:

> Prefer bishops more than two king steps from a corner.

## Implementation

- Remove the Phase 2 applicability predicate from the registered rule.
- Make the independent ordered-rule test pipeline apply the comparison to every candidate.
- Update guide-copy and rule-shape expectations.
- Cover the comparison in both Phase 1 and Phase 2.

## Verification

Run the focused Two Bishops and presentation tests, TypeScript, lint, and diagram freshness checks. Then find and open a current loop whose positions remain in Phase 1; reaching Phase 2 terminates loop search.

## Boundaries

- Do not change the corner-distance metric.
- Do not reorder the rule.
- Do not modify the main worktree.
