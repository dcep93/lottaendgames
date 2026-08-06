# Two Bishops Rule U / Rule A Split

## Goal

Replace rule u's combined distance-and-edge preference with two separate Phase 1 priorities:

> **rule u** — Phase 1: Prefer bishops further from Black's king.
>
> **rule a** — Prefer fewer bishops on the edge.

## Design

Rule u takes the smaller Chebyshev distance from Black's king across the two bishops in the resulting position and maximizes it. This maximin score moves the nearer bishop away instead of allowing one distant bishop to compensate for a nearby bishop. Edge bishops contribute their ordinary distance; edge occupancy is no longer part of rule u.

Rule a counts bishops on any board edge in the resulting position and minimizes that count.

The Phase 1 order becomes `rule z`, `rule y`, `rule a`, `rule x`, `rule w`, `rule v`, `rule u`. Rule a uses the target-building fallback gate, so it is skipped with z/y/x/w whenever a surviving safe rule-v check exists. Rule u runs after rule v as a normal Phase 1 comparison. Both rules are inactive for Phase 2 result positions.

## Verification

Preserve the direct scoring tests for rule u and rule a. Update the registered-rule order, independent priority pipeline, rule-shape expectations, supplied-position regression, and rendered guide-copy expectations. Run the focused Two Bishops and presentation tests, TypeScript, lint, and diagram validation. Finally, find and open a directly playable Phase 1 loop, treating Phase 2 entry as termination.
