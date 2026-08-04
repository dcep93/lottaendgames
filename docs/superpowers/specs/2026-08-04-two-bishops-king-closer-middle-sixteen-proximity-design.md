# Two Bishops King Closer Middle-Sixteen Proximity Design

## Goal

Replace the binary `king closer` preference for landing inside the middle 16 squares with a graded proximity tie-break.

## Semantics

The global `king closer` order is:

1. Minimize White king's Manhattan distance to Black's king.
2. On a tie, minimize White king's Manhattan distance to the nearest square in the inclusive `c3–f6` rectangle.

Distance to the middle 16 is calculated independently by axis:

- File distance is zero on files c through f; otherwise it is the distance to c or f.
- Rank distance is zero on ranks 3 through 6; otherwise it is the distance to rank 3 or 6.
- The score is the sum of file and rank distance.

Squares inside the rectangle score zero. For the current loop fixture, `Kg6` scores 1 and `Kh7` scores 3, so `Kg6` wins after both moves tie on distance to Black.

Non-king moves remain neutral on this second metric and retain the existing sentinel on the first metric.

## Presentation

The visible help text is exactly:

`Bring White's king closer to Black's king, preferring proximity to the the middle 16 squares.`

## Implementation

- Replace `kingCloserMiddleSixteenPenalty` with `kingCloserMiddleSixteenDistance`.
- Replace the boolean membership helper with a Manhattan distance-to-rectangle helper.
- Keep distance to Black as the first comparator.
- Update score shape, manual cascade, boundary, Phase 2, symmetry, and presentation assertions.

## Verification

Tests must prove:

- Middle-16 squares score zero.
- Distance increases by file and rank outside the rectangle.
- Distance to Black still outranks center proximity.
- The current `Kh7`/`Kg6` tie is resolved in favor of `Kg6`.
- The behavior remains global, including Phase 2.
- The exact requested help copy is visible.
- Full rule and presentation suites, diagram consistency, TypeScript, and diff checks pass.
- A fresh seeded cycle stays entirely in Phase 1; entering Phase 2 terminates loop search.
