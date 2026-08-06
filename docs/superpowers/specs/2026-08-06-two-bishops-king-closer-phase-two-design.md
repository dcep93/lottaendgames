# Phase-2-Only King Closer Design

## Goal

Limit the Two Bishops `king closer` priority to Phase 2. Its visible text will
be exactly:

> Phase 2: Bring White's king closer to Black's king, preferring proximity to
> the the middle 16 squares.

## Design

Gate the existing ordered rule with `isPhaseTwoPosition`. This keeps its
current comparison intact: preserve the preferred Phase 2 line first, minimize
squared Euclidean king distance second, and use distance to the middle sixteen
only as the final tie-breaker.

An applicability gate is preferable to zeroing Phase 1 score fields because it
makes the rule's scope explicit and prevents it from appearing as the reason
for a Phase 1 choice. The scoring fields remain available for focused metric
tests and diagnostics, but they do not eliminate Phase 1 candidates.

No rule is inserted in its former Phase 1 role. After `unclutter bishops`,
Phase 1 candidates therefore proceed directly to `check`.

## Verification

Update displayed-text expectations, add an explicit Phase 1 inactivity test,
and retain Phase 2 distance and middle-sixteen coverage. Adjust only fixtures
whose Phase 1 result legitimately changes because `king closer` no longer
participates. Run the full Two Bishops and presentation suites, typecheck,
lint, and diagram verification.
