# Two Bishops Rule r12: Phase 1 Distant Bishops

## Goal

Add Rule r12 immediately before Rule r. In Phase 1, prefer positions where the bishops remain at least three king-steps from Black.

## Behavior

- Evaluate Phase 1 after White's candidate move.
- Count White bishops whose Chebyshev/king distance from Black's king is at least 3.
- Prefer the candidate with the higher count: two qualifying bishops is best, then one, then zero.
- Leave Rule r12 inactive when the resulting position is Phase 2.
- Keep Rule r9 immediately before Rule r12 and Rule r immediately after it.

## UI

The priority guide displays:

> Rule r12 — Phase 1: Prefer bishops at least 3 squares from Black's king.

## Verification

- Add focused tests for the distance preference and Phase 2 inactivity.
- Verify active rule order, focused tests, production build, and the development cycle finder.
- Find a strict all-ideal loop, replay it in the sidebar, and reset it to `cursor=0`.
