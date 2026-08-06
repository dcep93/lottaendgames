# Two Bishops Rule U / Rule A Split

## Goal

Replace rule u's combined distance-and-edge preference with two consecutive Phase 1 priorities immediately after rule y:

> **rule u** — Phase 1: Prefer bishops further from Black's king.
>
> **rule a** — Prefer fewer bishops on the edge.

## Design

Rule u takes the smaller Chebyshev distance from Black's king across the two bishops in the resulting position and maximizes it. This maximin score moves the nearer bishop away instead of allowing one distant bishop to compensate for a nearby bishop. Edge bishops contribute their ordinary distance; edge occupancy is no longer part of rule u.

Rule a counts bishops on any board edge in the resulting position and minimizes that count. It runs only after rule u, so it breaks distance ties without defeating a greater rule-u score.

The Phase 1 order becomes `rule z`, `rule y`, `rule u`, `rule a`, `rule x`, `rule w`, `rule v`. Like the other target-building priorities before rule v, rules u and a are skipped whenever a surviving safe rule-v check exists. Both rules are inactive for Phase 2 result positions.

## Verification

Add direct scoring tests showing that rule u uses the nearer bishop's distance and ties the supplied `Bg3` with farther edge moves, plus a rule-a test showing that fewer edge bishops keeps `Bg3` among the ideal moves while removing two-edge alternatives. Update the registered-rule order, independent priority pipeline, rule-shape expectations, and rendered guide-copy expectations. Run the focused Two Bishops and presentation tests, TypeScript, lint, and diagram validation. Finally, find and open a directly playable Phase 1 loop, treating Phase 2 entry as termination.
