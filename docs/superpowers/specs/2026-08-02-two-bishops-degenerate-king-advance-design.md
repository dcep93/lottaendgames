# Two Bishops Degenerate King Advance

## Goal

Add an exact Phase 2 Degenerate repair for the position reached after `Ke6 Kh6` in the supplied line.

## Canonical Geometry

- Black king: `h6`
- White king: `e6`
- White bishops: exactly `e8` and `f6`
- Repair: `Ke6–e7`

Recognize only the eight board-wide D4 rotations and reflections. Do not permit translations or alternate bishop squares.

## Presentation

Add the subtype reason and diagram title `degenerate — king advance`. The diagram shows the canonical position and arrows `e6–e7`.

## Verification

- The supplied position uniquely recommends `Ke7` with the new subtype reason.
- All eight board-wide D4 transforms select the transformed king move.
- A translated lookalike and a position with the light bishop off `e8` do not match.
- Existing Diagonal king step behavior remains intact.
- Run focused Degenerate and diagram tests, targeted TypeScript and diff checks, then the fail-fast loop gate.

