# Two Bishops Exact Phase 2 Position

## Goal

Define Phase 2 from the supplied position, keep r11 aligned with that position, retain r5 as an independent later cage pattern, and use Euclidean king proximity for r15.

## Canonical Phase 2

The canonical Phase 2 position is `4k3/8/3K4/5BB1/8/8/8/8 w - - 4 3`:

- White king is on `d6`;
- the inner bishop is on `f5`;
- the outer bishop is on `g5`; and
- Black king is on `e8`.

Phase 2 accepts this exact piece placement under all eight rotations and reflections. Side to move and FEN counters do not affect the phase label. Any other placement is Phase 1.

## Enclosing Phase 2 diagonals

Rule r11 applies when the starting bishops control any adjacent parallel diagonals with Black strictly on a corner side and at least four diagonals between the wall and that corner. White's location does not affect applicability. The starting enclosure fixes the candidate corner.

## Rule r11

Text: "With bishops on enclosing phase 2 diagonals, prefer king proximity to a square a knight's move from Black's corner."

For each qualifying starting corner, find its two on-board knight-move squares and score candidate results by White king's minimum king-step distance to either square. Use the best distance if more than one starting corner qualifies. Bishop placement is not a tie-break in r11.

## Rule r5

Text: "With the Black king enclosed in a 2-square cage 2 from the corner, prefer king proximity to the square a knight's move from the corner and inline with the bishops."

For the canonical `a1` orientation, this rule applies when the bishops occupy `c3/d3` and Black occupies either cage square `c1/d1`. It minimizes White king's king-step distance to `b3`, the square a knight's move from `a1` and aligned with the bishops. Apply the same pattern under all rotations and reflections.

The r5 cage geometry is independent of the exact Phase 2 placement. Once this cage exists, r11's setup score is neutral. Because a king move toward `b3` improves r5 while a bishop move leaves its distance unchanged, the cage remains intact during that walk.

## Rule r15

Text: "Prefer king proximity."

Compare White-to-Black king proximity by squared Euclidean distance. Bishop moves preserve White's current king square. Thus, from `1k6/3K4/8/1BB5/8/8/8/8 w - - 2 2`, `Kd6` has distance eight while a bishop move such as `Bb5` preserves distance five, so `Kd6` loses.

## Rule removal and order

Remove r11.3 completely. The policy order becomes: mate, bishop safety, no stalemate, r5, r10, r11, r12, r15.

## Diagram

Display the supplied canonical position `4k3/8/3K4/5BB1/8/8/8/8 w - - 4 3`. Do not highlight any squares.

## Verification

Focused tests cover the exact canonical Phase 2 placement, all rotations/reflections, rejection of one-square deviations, r11's transformed corner and knight-square distance, r5's independent cage and king target under symmetry, r15's squared Euclidean comparison in the supplied regression, the diagram, and exact rule order/text. Then run the exact early-exit search from UI-valid roots and load the first valid four-ply loop at cursor 0.
