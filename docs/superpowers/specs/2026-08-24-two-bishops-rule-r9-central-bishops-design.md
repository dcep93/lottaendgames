# Two Bishops Rule r9: Restrict Black's Centerward Moves

## Goal

Add Rule r9 immediately after Rule rr5 and before Rule r so restricting Black's movement toward the center outranks White king proximity.

## Behavior

- After each White candidate, enumerate Black's legal replies.
- A reply moves toward the center when its destination has a lower Manhattan distance to the nearest of `d4`, `e4`, `d5`, and `e5` than Black's current square.
- Count those centerward replies and prefer the lower count.
- Apply Rule r9 in both phases whenever the Black king exists.
- Keep Rule rr5 as the preceding priority and Rule r as the following tie-break.

## UI

The priority guide displays:

> Rule r9 — Restrict Black from moving towards the center.

## Verification

- Add focused regression coverage for candidates allowing different numbers of centerward replies.
- Verify priority order, focused tests, production build, and the development cycle finder.
- Find a new exact all-ideal loop, replay it in the sidebar, and return it to `cursor=0`.
