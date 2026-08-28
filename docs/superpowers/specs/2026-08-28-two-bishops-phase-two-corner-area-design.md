# Two Bishops Phase 2 Corner Formation

## Goal

Define Phase 2 from the supplied corner formation, add the Phase 2 escape-square rule r8, keep r11 aligned with its enclosing-wall setup, retain r5 as an independent later cage pattern, and use Euclidean king proximity for r15.

## Canonical Phase 2

The canonical Phase 2 formation is represented by `k7/2KB4/3B4/8/8/8/8/8 w - - 2 2`:

- Black king is on `a5`, `a6`, `a7`, or `a8`;
- one bishop is anywhere on the diagonal containing `a3`; and
- the other bishop is anywhere on the diagonal containing `a4`.

Phase 2 accepts this formation under all eight rotations and reflections. White's king position, side to move, and FEN counters do not affect the phase label. Any other placement is Phase 1.

## Rule r8

Text: "Phase 2: Prefer control of the escape square, then check."

Rule r8 applies only when the starting position is Phase 2. In the canonical orientation, Black's escape square is immediately inward from Black's occupied edge square: `a5` maps to `b5`, `a6` to `b6`, `a7` to `b7`, and `a8` to `b8`. Apply the same mapping under rotation or reflection.

Score candidate results lexicographically: first prefer White control of the escape square, then prefer a check against Black.

## Enclosing Phase 2 diagonals

Rule r11 applies when the starting bishops control any adjacent parallel diagonals with Black strictly on a corner side and at least four diagonals between the wall and that corner. White's location does not affect applicability. The starting enclosure fixes the candidate corner.

## Rule r10 handoff

Text: "Prefer controlling adjacent diagonals not enclosing White, leaving Black as few diagonals as possible within its corner, but at least 4. Once such a wall already encloses Black, king moves preserve it for this rule."

When the starting bishops already form an enclosing Phase 2 wall, a king move inherits that wall's valid r10 score and diagonal count even if White crosses to its corner side. Bishop moves continue to be scored from their result normally. This lets the established bishop wall hand off to r11 without allowing a bishop to abandon it.

## Rule r9

Text: "Phase 1: If White's king is inside the smallest adjacent diagonals that enclose Black, walk the king toward the inside square edge-adjacent to the inner bishop and farther from Black's king. Then place the outer bishop in line with the other two pieces, then walk the king through the wall to the side opposite Black's king."

Rule r9 is neutral in Phase 2. In Phase 1 it derives its stage from the board rather than stored history:

1. From the smallest adjacent diagonal wall or walls that strictly enclose Black and also contain White, find the two orthogonally adjacent squares immediately inside the inner bishop's diagonal. Use the square with the greater squared Euclidean distance from Black as the staging square, and minimize White's king-step distance to it.
2. Once White reaches a staging square, keep the inner bishop fixed and prefer moving the outer bishop to the square immediately beyond the inner bishop, producing a straight three-square line with White's king.
3. Once that line exists, advance White's king across the same diagonal wall toward the side opposite Black. Stop applying r9 once White is strictly beyond the outer diagonal.

In `8/8/8/1k6/8/4B3/2K3B1/8 w - - 0 1`, the staging square is `e2`; the intended milestones are White king `e2`, `Be4`, `Kf3`, and `Kf4`.

## Rule r11

Text: "With bishops on enclosing phase 2 diagonals, prefer king proximity to a square a knight's move from Black's corner."

For each qualifying starting corner, find its two on-board knight-move squares and score candidate results by White king's minimum king-step distance to either square. Use the best distance if more than one starting corner qualifies. Bishop placement is not a tie-break in r11.

## Rule r5

Text: "With the Black king enclosed in a 2-square cage, prefer king proximity to a square in line with the bishops, closer to the edge."

Treat squares not controlled by either bishop as a king-move graph. Rule r5 applies when the connected component containing Black has exactly two squares and the bishops occupy orthogonally adjacent squares. Extend the bishops' line one square beyond either end, retain on-board candidates, and select the candidate or candidates with minimum edge distance. Minimize White king's king-step distance to those targets.

The r5 cage geometry is independent of Phase 2 and is invariant under rotation and reflection. The previous `c3/d3`, Black `c1/d1`, target `b3` pattern remains one valid instance rather than the complete definition.

## Rule r15

Text: "Prefer king proximity."

Compare White-to-Black king proximity by squared Euclidean distance. Bishop moves preserve White's current king square. Thus, from `1k6/3K4/8/1BB5/8/8/8/8 w - - 2 2`, `Kd6` has distance eight while a bishop move such as `Bb5` preserves distance five, so `Kd6` loses.

## Rule order

The policy order is: mate, bishop safety, no stalemate, r5, r8, r9, r10, r11, r12, r15.

## Diagram

Display the supplied canonical position `k7/2KB4/3B4/8/8/8/8/8 w - - 2 2`. Do not highlight any squares.

## Verification

Focused tests cover all four canonical Black edge squares, both bishop diagonals, arbitrary White king positions, all rotations/reflections, rejection of formation deviations, r8's escape-square control and check tie-break, r9's Phase 1 gate plus staging, alignment, and two-step wall crossing under symmetry, r10's established-wall handoff, r11's transformed corner and knight-square distance including the `Kb6` regression, r5's generic two-square cage, nearer-edge target, legacy instance, and symmetry, r15's squared Euclidean comparison, the diagram, and exact rule order/text. Then run the exact early-exit search from UI-valid roots, orient the first valid loop so Black starts closest to `a7`, and load it at cursor 0.
