# Two Bishops Rule D Design

## Rule

Add this priority after Rule C and immediately before `king closer` in both phases:

> **rule d** — When the Black king is 1 step away from the corner, and the White king is 2 steps away from that corner, make sure the White king doesn't screen the bishops.

## Applicability

Rule D applies in either phase when at least one board corner is exactly one king step from Black's king and exactly two king steps from White's king.

## Screening

Evaluate the resulting position. White's king screens a bishop when it is the sole blocker on that bishop's diagonal ray to any on-board square adjacent to Black's king, including diagonally and orthogonally adjacent squares. Removing only White's king must reveal a clear bishop ray to that target; any other intervening piece means the position is not counted as White-king screening on that ray.

Moves with no screened bishop ray beat moves with at least one. Rule D is binary; later `king closer` scoring breaks remaining ties.

## Verification

- Pin the exact rendered text and priority order.
- Cover the current Phase 1 loop geometry where `Kf2` screens the e1 bishop from g3.
- Cover a non-screening move from the same position.
- Verify rotations and reflections.
- Verify inactivity outside the corner-distance condition and activation in Phase 2.
- Run focused tests, lint, build, diagram freshness, and the strict Phase 1 loop gate.
