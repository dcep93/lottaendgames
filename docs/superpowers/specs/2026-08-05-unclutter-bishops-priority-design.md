# Unclutter Bishops Priority Design

## Goal

Keep `unclutter bishops` active in both phases, but place it immediately below `king pushable` in White's visible priority order.

## Behavior

The relevant priority sequence becomes:

1. `prep restricted area`
2. `king pushable`
3. `unclutter bishops`
4. `king closer`

This lets Phase 1 cage construction and king positioning filter moves before corner uncluttering. In Phase 2, the intervening Phase 1-only rules do not apply, so `unclutter bishops` remains the first applicable rule after `phase 2 wall`.

The rule keeps its global scope, help text, and comparison: prefer fewer bishops within two king steps of a corner.

## Implementation

- Move the registered rule immediately after `king pushable`.
- Reorder the independent expected-policy pipeline to match.
- Update metadata, guide-order, and affected Phase 1 integration expectations.

## Verification

Run the Two Bishops and presentation tests, TypeScript, lint, and diagram freshness checks. Then find and open a current Phase 1 loop, treating every transition to Phase 2 as termination.

## Boundaries

- Do not change the corner-distance metric.
- Do not restore a phase gate.
- Do not change `king pushable` scoring.
- Do not modify the main worktree.
