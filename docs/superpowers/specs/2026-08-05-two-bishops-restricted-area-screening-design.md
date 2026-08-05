# Two Bishops Restricted-Area Screening Design

## Goal

Change the Phase 1 rule copy and mechanic to:

> **restricted area** — Phase 1: Use the bishops to control 2 diagonals adjacent to Black's king, but not checking the king, preferring a smaller area for Black. White's king should not screen a bishop from a Black king-adjacent square

Replace the current requirement that White's king lie beyond both cage boundaries. Preserve the four-rule Phase 1 stack, its order, and all other Phase 1 and Phase 2 behavior.

## Cage Geometry

Continue recognizing a restricted area when the bishops occupy adjacent parallel diagonals and Black's king lies strictly beyond both boundaries. Continue excluding checking results and preferring the smaller raw geometric area.

Derive the cage side and area from the bishops and Black's king only. White's king may be inside the area, between the boundaries, or on a boundary unless it screens bishop control as defined below.

## Screening

Inspect every bishop and every on-board square adjacent to Black's king, including diagonal and orthogonal neighbors. White's king screens a bishop from a target when:

1. the bishop and target share a diagonal;
2. White's king lies strictly between them on that diagonal; and
3. every other intermediate square is empty.

Equivalently, removing only White's king would reveal a clear bishop ray to the Black-adjacent target. Target occupancy does not matter because a bishop controls the target square when its ray reaches it.

If any such screened target exists, the candidate does not qualify as a restricted area. A different intervening piece does not count as White-king screening because removing White's king would still not reveal control.

## Preparation Consistency

Use the same screening-aware cage validity when deriving the starting cage boundaries for `prep restricted area`. An attacked bishop can receive the maintain-and-travel preference only when the starting position has a qualifying, unscreened restricted area.

Do not change the preparation fallback, ideal-cage geometry, bishops-further distance, phase classification, Black policy, universal guards, or Phase 2 rules.

## Verification

- Assert the exact rendered wording.
- Replace the old White-outside-cage tests with positions where White is inside, between, and on a boundary without screening; each must retain its geometric area.
- Cover a White king that is the sole diagonal blocker to a Black-adjacent square and assert that the cage is rejected.
- Cover a ray with another blocker and assert that it is not classified as White-king screening.
- Verify D4 symmetry and translation behavior.
- Verify preparation escape activation only from an unscreened starting cage.
- Run the focused Two Bishops and presentation tests, TypeScript, lint, diagram freshness, and diff checks.
- Find and open an exact current-policy Phase 1 loop, treating entry into Phase 2 as termination.

## Assumption

“Black king-adjacent square” means any of the up to eight on-board neighboring squares, including diagonal neighbors.
