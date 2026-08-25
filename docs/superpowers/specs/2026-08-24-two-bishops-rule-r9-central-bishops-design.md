# Two Bishops Rule r9: Phase 2 Knight Placement

## Goal

Keep Rule r9 immediately after Rule rr5 and before Rule r. In Phase 2, when Black is off the edge, it should shape White's king into a knight relationship with Black before preferring the more central such square.

## Behavior

- Apply Rule r9 only when the candidate's resulting position is Phase 2.
- Evaluate the phase after White's candidate move, consistently with the policy's other phase-sensitive rules.
- Apply Rule r9 only while Black's king is off the edge.
- First prefer a resulting White king square that is exactly a knight's move from Black's current square.
- Among equally eligible king squares, prefer the White king closer to the nearest central square: `d4`, `e4`, `d5`, or `e5`.
- Keep the knight relationship as the stronger criterion; center proximity cannot compensate for missing it.
- Do not compare Rule r9 penalties in Phase 1 or while Black is on an edge.
- Keep Rule rr5 as the preceding priority and Rule r as the following tie-break.

## UI

The priority guide displays:

> Rule r9 — Phase 2: If Black's king is not on the edge, prefer the White king a knight's move away from Black, closer to the center.

## Verification

- Add focused regression coverage for knight-shape priority, the center tie-break, and Phase 1/edge inactivity.
- Verify priority order, focused tests, production build, and the development cycle finder.
- Find a new exact all-ideal loop, replay it in the sidebar, and return it to `cursor=0`.
