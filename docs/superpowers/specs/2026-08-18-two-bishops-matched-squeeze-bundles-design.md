# Matched Two Bishops Squeeze Bundles

## Scope

Rules R, S, U, and V each name more than one squeeze diagonal. Every named diagonal used to establish, satisfy, or score one of these rules must belong to the same king-relative squeeze geometry on the same Black-king flank.

## Behavior

- Rule R must pair its primary and secondary diagonals from one geometry.
- Rule S must pair its primary and tertiary diagonals from one geometry.
- Rule U must pair its secondary and reachable primary diagonals from one geometry.
- Rule V must pair its primary and secondary diagonals from one geometry. Its setup branch requires the resulting bishops to control that matched primary-secondary pair. Its checking branch must likewise use the secondary belonging to the already-controlled primary.

In `8/8/3k4/6B1/3K4/3B4/8/8 w - - 0 1`, `Bf5` produces a matched primary-secondary pair and remains preferred; `Bb5` combines occupied diagonals from opposite bundles and is rejected by Rule V.

## Architecture

Keep squeeze geometries as the unit of evaluation. Add a shared predicate for determining whether distinct bishops occupy specified roles within one geometry, then use it inside the affected rule evaluators instead of aggregating role matches across separate geometry searches.

## Presentation

Rendered rule text and diagrams remain unchanged. The existing terms primary, secondary, and tertiary imply membership in one squeeze bundle.

## Verification

Add the supplied Rule V regression and symmetry coverage, retain existing Rule R/S/U/V examples, run focused Two Bishops tests, lint, and build, then find a Phase 1 loop while treating entry into Phase 2 as termination.
