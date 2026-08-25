# Two Bishops Rule x2: Central Bishops

## Goal

Add Rule x2 immediately before Rule x so positions without a completed double-diagonal wall prefer more central bishop placements.

## Behavior

- Determine whether the double-diagonal wall exists in the position before White moves.
- If the wall does not exist, Rule x2 applies to every candidate White move.
- Score the resulting bishop squares by summing each bishop's Manhattan distance to the nearest of `d4`, `e4`, `d5`, and `e5`.
- Prefer the lower total.
- If the wall already exists before White moves, Rule x2 is inactive.
- Rule x remains unchanged and breaks ties after Rule x2.

## UI

The priority guide displays:

> Rule x2 — If the double diagonal wall hasn't been built yet, prefer bishops closer to the center.

## Verification

- Add a focused regression showing that Rule x2 prefers a lower summed center distance before the wall is built.
- Add a regression showing that Rule x2 is inactive after the wall is built.
- Verify priority order, focused tests, production build, and the development cycle finder.
- Find a new exact all-ideal loop, replay it in the sidebar, and return it to `cursor=0`.
