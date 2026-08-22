# Two Bishops Rule B screen position

## Goal

Add this visible priority immediately after Rule A:

> **rule b** — In the screen position, move the king to 2 edge squares from the corner.

## Geometry

Use the exact canonical lower-right pattern and every board rotation or reflection of it:

- Black king on `f1`;
- White king on `g3`;
- one White bishop on `h4`, screened by the White king;
- the other White bishop anywhere on the `d1–h5` diagonal.

In a legal instance of that position Rule B assigns its unique best score to `Kh3`. The target `h3` lies two edge squares from the associated corner `h1`. The `e2` placement remains highlighted as part of the conceptual diagonal even though it checks `f1` and therefore cannot occur with White to move. Existing earlier priorities, including `mate in 8 ish`, remain authoritative when they apply.

Do not generalize the rule to every position where a king happens to screen a bishop. Translations do not apply.

## Rule integration

Implement the recognizer in a focused helper and expose an applicability flag and move penalty through the existing Two Bishops score. Insert Rule B directly after Rule A and before Rule N in scoring order, rendered rule order, and help-board order.

## Diagram

Render the canonical screen position with chess pieces. Highlight the flexible `d1–h5` bishop diagonal, mark `h1` as the associated corner, and mark `h3` as White's target square. The diagram represents all rotations and reflections.

## Verification

- Prove Rule B recognizes every flexible bishop placement on `d1–h5`, assigns `Kh3` its unique best score in legal instances, and separately prove full-policy selection where no earlier priority applies.
- Prove all rotations and reflections choose the transformed king move.
- Prove near misses do not activate Rule B.
- Verify the active rule order, generated diagram, Phase 2 flows, TypeScript build, and diagram drift check.
- Run the fast Two Bishops verifier and load its resulting loop at `cursor=0`.
