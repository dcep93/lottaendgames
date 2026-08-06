# Rule ZZ Closest-Corner Distance Design

## Goal

Replace Rule ZZ's fixed four-corner five-square Ls with this priority:

> Phase 1: Keep bishops more than 2 steps away from Black's closest corner.

## Geometry

Identify Black's closest corner with the same squared-Euclidean comparison
already used to derive the Phase 1 target square. Retain every corner when
Black is equally close to multiple corners.

Measure a bishop's “steps” from those corners as king/Chebyshev distance. A
bishop is penalized when it is zero, one, or two king steps from any tied
closest corner; Rule ZZ continues to prefer fewer penalized bishops. Thus, for
an `a1` target corner, the excluded region is the `a1:c3` corner block.

The closest corner is determined from Black's starting square for the White
move, matching the existing Phase 1 target-square context.

## Implementation

Extract the nearest-corner calculation into a shared helper and reuse it for
both Rule ZZ and Phase 1 target-square derivation. Rename Rule ZZ's internal
score field to describe the new closest-corner metric. Keep its priority order
and Phase 1 applicability unchanged.

## Verification

Cover the two-step boundary, a three-step escape, tied nearest corners, D4
symmetry, visible text, and Phase 2 inactivity. Run the full Two Bishops and
presentation suites, typecheck, lint, and diagram verification.
