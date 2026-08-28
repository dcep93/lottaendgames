# Two Bishops Phase 2 Corner Formation

## Goal

Define Phase 2 from the supplied corner formation, add the Phase 2 escape-square rule r8, keep r11 aligned with its enclosing-wall setup, retain r5 as an independent later cage pattern, and use Euclidean king proximity for r15.

## Canonical Phase 2

The canonical Phase 2 formation is represented by `k7/2KB4/3B4/8/8/8/8/8 w - - 2 2`:

- Black king is on `a5`, `a6`, `a7`, or `a8`;
- White king is on `c7`;
- one bishop is anywhere on the diagonal containing `a3`; and
- the other bishop is anywhere on the diagonal containing `a4`.

Phase 2 accepts this formation under all eight rotations and reflections. Side to move and FEN counters do not affect the phase label. Any other placement is Phase 1.

## Rule r8

Text: "Phase 2: Prefer control of the escape square, then check."

Rule r8 applies only when the starting position is Phase 2. In the canonical orientation, Black's escape square is immediately inward from Black's occupied edge square: `a5` maps to `b5`, `a6` to `b6`, `a7` to `b7`, and `a8` to `b8`. Apply the same mapping under rotation or reflection.

Score candidate results lexicographically: first prefer White control of the escape square, then prefer a check against Black.

## Enclosing Phase 2 diagonals

Rule r11 applies when the starting bishops control any adjacent parallel diagonals with Black strictly on a corner side and at least four diagonals between the wall and that corner. White's location does not affect applicability. The starting enclosure fixes the candidate corner.

## Rule r10 handoff

Text: "Prefer controlling adjacent diagonals not enclosing White, leaving Black as few diagonals as possible within its corner, but at least 4. Once such a wall already encloses Black, king moves preserve it for this rule."

When the starting bishops already form an enclosing Phase 2 wall, a king move inherits that wall's valid r10 score and diagonal count even if White crosses to its corner side. Bishop moves continue to be scored from their result normally. This lets the established bishop wall hand off to r11 without allowing a bishop to abandon it.

## Rule r11

Text: "With bishops on enclosing phase 2 diagonals, prefer king proximity to a square a knight's move from Black's corner."

For each qualifying starting corner, find its two on-board knight-move squares and score candidate results by White king's minimum king-step distance to either square. Use the best distance if more than one starting corner qualifies. Bishop placement is not a tie-break in r11.

## Rule r5

Text: "With the Black king enclosed in a 2-square cage 2 from the corner, prefer king proximity to the square a knight's move from the corner and inline with the bishops."

For the canonical `a1` orientation, this rule applies when the bishops occupy `c3/d3` and Black occupies either cage square `c1/d1`. It minimizes White king's king-step distance to `b3`, the square a knight's move from `a1` and aligned with the bishops. Apply the same pattern under all rotations and reflections.

The r5 cage geometry is independent of Phase 2. Once this cage exists, r11's setup score is neutral. Because a king move toward `b3` improves r5 while a bishop move leaves its distance unchanged, the cage remains intact during that walk.

## Rule r15

Text: "Prefer king proximity."

Compare White-to-Black king proximity by squared Euclidean distance. Bishop moves preserve White's current king square. Thus, from `1k6/3K4/8/1BB5/8/8/8/8 w - - 2 2`, `Kd6` has distance eight while a bishop move such as `Bb5` preserves distance five, so `Kd6` loses.

## Rule order

The policy order is: mate, bishop safety, no stalemate, r5, r8, r10, r11, r12, r15.

## Diagram

Display the supplied canonical position `k7/2KB4/3B4/8/8/8/8/8 w - - 2 2`. Do not highlight any squares.

## Verification

Focused tests cover all four canonical Black edge squares, both bishop diagonals, all rotations/reflections, rejection of formation deviations, r8's escape-square control and check tie-break, r10's established-wall handoff, r11's transformed corner and knight-square distance including the `Kb6` regression, r5's independent cage and king target under symmetry, r15's squared Euclidean comparison, the diagram, and exact rule order/text. Then run the exact early-exit search from UI-valid roots, orient the first valid loop so Black starts closest to `a7`, and load it at cursor 0.
