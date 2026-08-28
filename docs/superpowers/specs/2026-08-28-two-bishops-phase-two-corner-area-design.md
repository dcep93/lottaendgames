# Two Bishops Phase 2 Corner Area

## Goal

Replace the just-added Phase 2 template, remove r11.3, and consolidate Phase 2 setup into r11.

## Canonical Phase 2

For the canonical `a1` orientation:

- White king is on `d4`;
- the outer bishop is on `f1`;
- the inner bishop is anywhere on the `a5–e1` diagonal (`a5`, `b4`, `c3`, `d2`, or `e1`); and
- Black king is anywhere in the corner area strictly beyond that diagonal: the ten squares whose file-plus-rank index is at most three.

Phase 2 accepts this template under all eight rotations and reflections. Any other position is Phase 1.

The inner bishop's preferred long-diagonal square is `c3`, the intersection of `a5–e1` with the long `a1–h8` diagonal. Rule r11 then prefers the outer bishop on `d3`, where bishops on `c3/d3` enclose Black on `c1/d1` in a two-square cage whose nearer square is two squares from `a1`.

## Enclosing Phase 2 diagonals

Rule r11 applies when the starting bishops control the two transformed enclosing Phase 2 diagonals: `a5–e1` and its adjacent outer diagonal in the canonical orientation, with Black inside the corresponding corner area. White's location does not affect applicability. The starting enclosure fixes the candidate target orientation.

## Rule r11

Text: "With bishops on enclosing phase 2 diagonals, prefer king proximity to its phase 2 square, then inner bishop to its long diagonal square, then outer bishop to the square that encloses Black into a 2 square cage."

Score candidate results lexicographically:

1. king-step distance from White's king to `d4`;
2. whether the inner bishop occupies `c3`; and
3. whether the outer bishop occupies `d3`.

Use the lexicographically best transformed orientation if more than one starting orientation qualifies.

## Rule r11.5

Text: "With the Black king enclosed in a 2-square cage 2 from the corner, prefer king proximity to the square a knight's move from the corner and inline with the bishops."

For the canonical `a1` orientation, this rule applies when the bishops occupy `c3/d3` and Black occupies either cage square `c1/d1`. It minimizes White king's king-step distance to `b3`, the square a knight's move from `a1` and aligned with the bishops. Apply the same pattern under all rotations and reflections.

Once this cage exists, r11's setup score is neutral so its earlier `d4` king target cannot block r11.5 from walking the king to `b3`. Because a king move toward `b3` improves r11.5 while a bishop move leaves its distance unchanged, the cage remains intact during that walk.

## Rule removal and order

Remove r11.3 completely. The policy order becomes: mate, bishop safety, no stalemate, r10, r11, r11.5, r12, r15.

## Diagram

Replace the prior Phase 2 diagram with the canonical Phase 2 position using White king `d4`, bishops `c3/f1`, and Black king `d1`. Do not highlight any squares.

## Verification

Focused tests cover the canonical Phase 2 template with every allowed inner-bishop square, Black throughout the corner area, all rotations/reflections, rejection outside the corner, r11's king/inner/outer order, r11.5's cage and king target under symmetry, removal of r11.3, the diagram, and exact rule order/text. Then run the exact early-exit search from UI-valid roots and load the first valid four-ply loop at cursor 0.
