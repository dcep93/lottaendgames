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

Text: "With bishops on adjacent diagonals, prefer a waiting bishop move that keeps them adjacent without allowing Black to capture either bishop. Then prefer the Black king enclosed in a 2-square cage, then king proximity to a square in line with the bishops, closer to the edge."

When the starting bishops occupy adjacent diagonals, r5 first distinguishes safe waiting moves. A candidate satisfies this priority only when it moves a bishop, the result still places the bishops on adjacent diagonals, and no legal Black reply captures either bishop. When the starting bishops are not adjacent, this priority is neutral. This board-derived gate breaks king shuffles without changing r4's finite, explicitly recognized mating branches.

Treat squares not controlled by either bishop as a king-move graph. A candidate result has a 2-square cage when the connected component containing Black has exactly two squares and the bishops occupy orthogonally adjacent squares. Score candidates lexicographically: first prefer results with such a cage, then, among caged results, extend the bishops' line one square beyond either end, retain on-board candidates, select the candidate or candidates with minimum edge distance, and minimize White king's king-step distance to those targets. Candidates without a cage receive a cage penalty and a neutral distance score.

The r5 cage geometry is independent of Phase 2 and is invariant under rotation and reflection. The previous `c3/d3`, Black `c1/d1`, target `b3` pattern remains one valid instance rather than the complete definition.

## Rule r4

Text: "Once rule r5 has been achieved, follow the mating pattern: control the escape square, then check, sometimes using a waiting move. When r4 applies, later construction rules are inactive."

Rule r4 precedes r5. It is neutral until a known mating-pattern branch is reached after r5 has established the two-square cage. Every recognized r4 position must lie in a finite branch whose Black replies are forced and whose leaves are checkmate; a cycle or non-mating leaf is an implementation bug. The first branch is the supplied line from `8/8/2K5/k1B5/2B5/8/8/8 w - - 20 11`: r5 plays `Bb3`; after `Ka6`, r4 prefers `Bb4`; after `Ka7`, `Kc7`; after `Ka6`, `Bc4+`; after `Ka7`, `Bc5+`; and after `Ka8`, `Bd5#`. The ordinary mate priority remains above r4.

Match each branch position and result structurally, ignoring FEN move counters, and accept every rotation and reflection. At a recognized branch position, the supplied result receives no r4 penalty and every other result receives one. At an unrecognized position, r4 is neutral so later rules decide. Future branch additions extend this same position-to-result table.

At a recognized r4 position, r4 defines the complete accepted move set. Rules r5 and later are inapplicable there, so they cannot narrow an intentionally multi-move r4 result. Mate, bishop safety, and stalemate prevention remain higher priorities.

In `8/k1K5/2B5/8/1B6/8/8/8 w - - 4 3`, r4 uniquely selects `Bb5`, forcing `Ka8` and reaching the waiting stage.

A preceding trigger is `8/2K5/2B5/k1B5/8/8/8/8 w - - 0 1`. The bishop on `c6` controls Black's escape square `b5`; r4 uniquely selects `Bd6`. After forced `Ka6`, the shifted continuation uniquely selects `Bb4`, forcing `Ka7`, and then `Bb5`, forcing `Ka8`.

The shifted continuation `8/2K5/k1BB4/8/8/8/8/8 w - - 2 2` is an acceptable instance of the GIF's `Bb4` pattern. Rule r4 uniquely prefers `Bb4` from this position and from every rotation or reflection of it.

After `Bb5 Ka8`, accept `Kc8` or any legal bishop move that keeps the bishops on the diagonals `a5`–`e1` and `a6`–`f1`, except `Ba6`. The canonical waiting set is `Kc8`, `Ba5`, `Bc3`, `Bd2`, `Be1`, `Bc4`, `Bd3`, `Be2`, and `Bf1`. Every waiting move forces `Ka7`. Generate the next checking move so it forces `Ka8`, then generate every immediate checkmate. For the supplied branch this yields `Bc3 Ka7 Bd4+ Ka8 Bc6#`; the other eight waiting choices receive their corresponding forced check-and-mate continuations. Expand the entire finite branch through all rotations and reflections.

Display the complete supplied line as a looping animated rule diagram, including the r5 entry move and every Black reply.

## Rule r15

Text: "Prefer king proximity."

Compare White-to-Black king proximity by squared Euclidean distance. Bishop moves preserve White's current king square. Thus, from `1k6/3K4/8/1BB5/8/8/8/8 w - - 2 2`, `Kd6` has distance eight while a bishop move such as `Bb5` preserves distance five, so `Kd6` loses.

## Rule order

The policy order is: mate, bishop safety, no stalemate, r4, r5, r8, r9, r10, r11, r12, r15.

## Diagram

Display the supplied canonical position `k7/2KB4/3B4/8/8/8/8/8 w - - 2 2`. Do not highlight any squares.

## Verification

Focused tests cover all four canonical Black edge squares, both bishop diagonals, arbitrary White king positions, all rotations/reflections, rejection of formation deviations, r8's escape-square control and check tie-break, r9's Phase 1 gate plus staging, alignment, and two-step wall crossing under symmetry, r10's established-wall handoff, r11's transformed corner and knight-square distance including the `Kb6` regression, r5's safe adjacent-diagonal waiting move, rejection of capturable waiting moves and king shuffles, candidate-result cage creation priority, generic two-square cage, nearer-edge target, legacy instance, and symmetry, r4's full supplied branch, symmetry, neutrality outside known branches, exact animated frames, r15's squared Euclidean comparison, the diagram, and exact rule order/text. Then run the exact early-exit search from UI-valid roots, orient the first valid loop so Black starts closest to `a7`, and load it at cursor 0.
