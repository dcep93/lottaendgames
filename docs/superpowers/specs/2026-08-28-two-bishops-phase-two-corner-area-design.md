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

## Rule r10

Text: "Prefer controlling adjacent diagonals."

Rule r10 compares only whether the two bishops control adjacent parallel diagonals on either diagonal axis. It does not require either king to be on a particular side and does not rank adjacent pairs by corner area.

## Rule r11

Text: "If the White king is inside the smallest diagonals that enclose Black, shrink the diagonals."

From the starting adjacent diagonal pairs that strictly enclose Black, select the pair or pairs enclosing the smallest corner area. Rule r11 applies only when White's king is inside one of those same corner areas. Candidate moves must preserve adjacent diagonals and keep Black within or on their boundary; prefer the candidate with the smallest resulting corner area. In `8/8/8/1k6/8/4B3/2K3B1/8 w - - 0 1`, this makes `Bf1+` uniquely best.

## Rule r5

Text: "With the Black king enclosed in a 2-square cage 2 from the corner, prefer king proximity to the square a knight's move from the corner and inline with the bishops."

For the canonical `a1` orientation, this rule applies when the bishops occupy `c3/d3` and Black occupies either cage square `c1/d1`. It minimizes White king's king-step distance to `b3`, the square a knight's move from `a1` and aligned with the bishops. Apply the same pattern under all rotations and reflections.

The r5 cage geometry is independent of Phase 2. Once this cage exists, r11's setup score is neutral. Because a king move toward `b3` improves r5 while a bishop move leaves its distance unchanged, the cage remains intact during that walk.

## Rule r15

Text: "Prefer king proximity."

Compare White-to-Black king proximity by squared Euclidean distance. Bishop moves preserve White's current king square. Thus, from `1k6/3K4/8/1BB5/8/8/8/8 w - - 2 2`, `Kd6` has distance eight while a bishop move such as `Bb5` preserves distance five, so `Kd6` loses.

## Rule order

The policy order is: mate, bishop safety, no stalemate, r8, r5, r10, r11, r12, r15.

## Diagram

Display the supplied canonical position `k7/2KB4/3B4/8/8/8/8/8 w - - 2 2`. Do not highlight any squares.

## Verification

Focused tests cover all four canonical Black edge squares, both bishop diagonals, all rotations/reflections, rejection of formation deviations, r8's escape-square control and check tie-break, r10's adjacency-only behavior, r11's smallest-enclosure applicability and `Bf1+` shrink regression under symmetry, r5's independent cage and king target under symmetry, r15's squared Euclidean comparison, the diagram, and exact rule order/text. Then run the exact early-exit search from UI-valid roots, orient the first valid loop so Black starts closest to `a7`, and load it at cursor 0.
