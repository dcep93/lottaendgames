# Two Bishops Specific Phase 2

## Goal

Define Phase 2 by exact piece squares, add its diagram, and add rules r11 and r11.3.

## Canonical Phase 2

The canonical `a1` orientation is:

- White king: `b3`;
- outer bishop: `d3`;
- inner bishop: `c3`; and
- Black king: `b1` or `c1`.

Phase 2 accepts this template under all eight board rotations and reflections. Any other position is Phase 1. The existing broad geometric Phase 2 detector is replaced for Two Bishops policy and phase labeling.

## Proper enclosure

Black is properly enclosed at a corner when the bishops control adjacent parallel diagonals whose corner-side region contains exactly four diagonals and Black is strictly inside that region. White's location does not affect proper enclosure.

Proper enclosure identifies a stable corner. Each corner has the two transformed Phase 2 orientations inherited from the canonical template.

## Rule r11

Text: "Prefer Bishops on Phase 2 square when Black is properly enclosed, outer then inner."

When the starting position properly encloses Black, score each result against the Phase 2 templates for those enclosed corners. First prefer a bishop on the template's outer square, then a bishop on its inner square. Use the lexicographically best matching template when multiple transformed orientations or corners qualify.

## Rule r11.3

Text: "Walk the king to its Phase 2 square."

When the starting position properly encloses Black, minimize White king's king-step distance to the corresponding Phase 2 king square. Use the best distance across the same transformed corner templates. The enclosed corner is fixed from the starting position so candidate moves cannot switch targets.

## Order

The policy order becomes: mate, bishop safety, no stalemate, r10, r11, r11.3, r12, r15.

## Diagram

Display `8/8/8/8/8/1KBB4/8/3k4 w - - 6 4`. It shows White already on `b3/c3/d3`, Black properly enclosed on `d1`, and highlights `b1/c1` as Black's two Phase 2 destinations.

## Verification

Focused tests cover the exact canonical template, both Black squares, every rotation/reflection, rejection of the diagram as Phase 2 while Black remains on `d1`, exact-four-diagonal enclosure, r11 outer-before-inner scoring, r11.3 king distance, diagram contents, rule text, and rule order. Then run the exact early-exit search from UI-valid roots and load the first valid four-ply loop at cursor 0.
