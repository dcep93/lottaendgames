# Two Bishops Restrict Area: Confinement Design

## Goal

Revise the visible Phase 1 priority to:

> **restrict area** — Phase 1: Use the bishops to control 2 diagonals adjacent to Black's king, but not checking the king, preferring a smaller area (min 6) for Black. White's king should not be within the area or those diagonals. If not possible, bishop control a square diagonally adjacent to Black's king, preferring squares closer to the center of the board. If a bishop is attacked while maintaining the restricted area, maintain the diagonal and move it as far as possible.

## Confinement Geometry

The primary stage recognizes two bishops on adjacent parallel board diagonals. For each of the two diagonal orientations, represent each bishop's diagonal by its file/rank invariant. The orientation qualifies when the bishops' invariant values differ by one and Black's king lies strictly outside the pair.

The raw Black-side area is the number of board squares strictly beyond the nearer boundary diagonal on Black's side. This is a geometric cage count: boundary squares are excluded, and piece attacks and blockers do not change the area.

White's king must lie strictly beyond the opposite boundary diagonal. If Black lies below both adjacent diagonal values, White must lie above both; if Black lies above both, White must lie below both. White on either boundary or within Black's side of the cage invalidates that orientation.

If both orientations qualify, use the smaller raw area. A checking result does not qualify.

## Comparison

Clamp every qualifying raw area to a minimum comparison value of six:

`comparison area = max(raw area, 6)`

Prefer the smaller comparison area. This means cages smaller than six do not gain additional priority. In the supplied position, preserving the existing cage with `Kd5`, playing `Bc7`, and shrinking it further with `Bc8` all compare as area six; the later `king closer` rule selects `Kd5`.

## Attacked Bishop Escape

When the starting position already has a valid restricted-area cage and Black's king attacks a bishop, add a tiebreak after area comparison and before `king closer`. Prefer a legal surviving move by the attacked bishop that keeps it on one of its current qualifying cage boundary diagonals. Among those moves, maximize bishop travel length measured in traversed diagonal squares.

The tiebreak applies only when at least one surviving candidate performs such an escape. It does not force an impossible boundary-preserving move, does not reward moving the unthreatened bishop, and does not select a different cage diagonal merely because the resulting comparison area is equal.

Use the existing fallback only when every surviving candidate lacks a qualifying non-checking adjacent-diagonal cage. Among non-checking results controlling a square diagonally adjacent to Black's king, prefer the controlled target closest to the center using the existing Manhattan distance to the central four squares.

## Scope

Replace the controlled-diagonal-count threshold with the confinement-area score. Keep `restrict area` Phase 1-only and in its current slot before `king closer`. Do not change phase classification, universal safety priorities, Phase 2 rules, Black policy, `king closer`, or `check`. No diagram is required.

## Verification

- Assert the exact visible wording and rule order.
- Assert raw and clamped areas for `Kd5`, `Bc7`, and `Bc8` in the supplied position, and assert that `Kd5` is uniquely selected by `king closer`.
- Cover smaller versus larger cages, both diagonal orientations, White inside the area, White on each boundary, checking exclusion, attacked-bishop boundary preservation and maximum travel, no-op behavior when no escape survives, fallback activation and center preference, Phase 2 inactivity, D4 symmetry, and translation behavior.
- Run focused and full Two Bishops and presentation tests, TypeScript, lint, diagram freshness, and diff hygiene.
- Find a strict exact-repetition Phase 1 loop, treating entry into Phase 2 as termination, and open it on the isolated port 5174 server.
