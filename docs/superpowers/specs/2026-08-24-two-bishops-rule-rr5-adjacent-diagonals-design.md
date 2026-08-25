# Two Bishops Rule rr5: Adjacent Diagonals

## Goal

Add Rule rr5 immediately before Rule r so White prefers the two bishops on adjacent parallel diagonals.

## Behavior

- Evaluate the bishop squares after White's candidate move.
- The bishops are on adjacent diagonals when either their `file - rank` diagonal indices differ by exactly 1 or their `file + rank` diagonal indices differ by exactly 1.
- Assign penalty 0 to adjacent-diagonal pairs and penalty 1 to all other pairs.
- Apply the rule in both phases and without requiring a corner diagonal or completed double-diagonal wall.
- Keep Rule r unchanged as the next tie-break.

## UI

The priority guide displays:

> Rule rr5 — Prefer bishops on adjacent diagonals.

## Verification

- Add focused examples for both diagonal directions and a non-adjacent pair.
- Verify priority order, focused tests, production build, and the development cycle finder.
- Find a new exact all-ideal loop, replay it in the sidebar, and return it to `cursor=0`.
