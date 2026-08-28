# Two Bishops Phase 2 Corner Area

## Goal

Replace the just-added Phase 2 template, remove r11.3, and consolidate Phase 2 setup into r11.

## Canonical Phase 2

For the canonical `a1` orientation:

- White king is on `d4`;
- the outer bishop is on `d3`;
- the inner bishop is anywhere on the `a5–e1` diagonal (`a5`, `b4`, `c3`, `d2`, or `e1`); and
- Black king is anywhere in the corner area strictly beyond that diagonal: the ten squares whose file-plus-rank index is at most three.

Phase 2 accepts this template under all eight rotations and reflections. Any other position is Phase 1.

The inner bishop's preferred long-diagonal square is `c3`, the intersection of `a5–e1` with the long `a1–h8` diagonal. The outer bishop's preferred two-square-cage square is `d3`.

## Enclosing Phase 2 diagonals

Rule r11 applies when the starting bishops control the two transformed enclosing Phase 2 diagonals: `a5–e1` and its adjacent outer diagonal in the canonical orientation, with Black inside the corresponding corner area. White's location does not affect applicability. The starting enclosure fixes the candidate target orientation.

## Rule r11

Text: "With bishops on enclosing phase 2 diagonals, prefer king proximity to its phase 2 square, then inner bishop to its long diagonal square, then outer bishop to the square that encloses Black into a 2 square cage."

Score candidate results lexicographically:

1. king-step distance from White's king to `d4`;
2. whether the inner bishop occupies `c3`; and
3. whether the outer bishop occupies `d3`.

Use the lexicographically best transformed orientation if more than one starting orientation qualifies.

## Rule removal and order

Remove r11.3 completely. The policy order becomes: mate, bishop safety, no stalemate, r10, r11, r12, r15.

## Diagram

Replace the prior Phase 2 diagram with the canonical target position using White king `d4`, bishops `c3/d3`, and Black king `d1`. Highlight the five-square `a5–e1` inner diagonal and the ten-square Black corner area.

## Verification

Focused tests cover the canonical Phase 2 template with every allowed inner-bishop square, Black throughout the corner area, all rotations/reflections, rejection outside the corner, r11's king/inner/outer order, removal of r11.3, the diagram, and exact rule order/text. Then run the exact early-exit search from UI-valid roots and load the first valid four-ply loop at cursor 0.
