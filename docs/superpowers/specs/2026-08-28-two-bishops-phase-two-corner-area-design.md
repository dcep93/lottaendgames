# Two Bishops Phase 2 Corner Formation

## Goal

Define Phase 2 from the supplied corner formation, keep r7 aligned with its enclosing-wall setup, retain r5 as an independent later cage pattern, and use Euclidean king proximity for r15.

## Canonical Phase 2

The canonical Phase 2 formation is represented by `k7/2KB4/3B4/8/8/8/8/8 w - - 2 2`:

- Black king is on `a5`, `a6`, `a7`, or `a8`;
- one bishop is anywhere on the diagonal containing `a3`; and
- the other bishop is anywhere on the diagonal containing `a4`.

Phase 2 accepts this formation under all eight rotations and reflections. White's king position, side to move, and FEN counters do not affect the phase label. Any other placement is Phase 1.

## Enclosing Phase 2 diagonals

Rule r7 applies when the starting bishops control any adjacent parallel diagonals with Black strictly on a corner side and at least four diagonals between the wall and that corner. White's location does not affect applicability. The starting enclosure fixes the candidate corner.

## Rule r10

Text: "Prefer controlling adjacent diagonals not enclosing White, leaving Black as few diagonals as possible within its corner, but at least 4."

Score every candidate from the adjacent-diagonal wall in its resulting position. No move inherits a wall score from the starting position.

## Rule r9

Text: "If White's king is inside the smallest adjacent diagonals that enclose Black, walk the king toward the inside square edge-adjacent to the inner bishop and farther from Black's king. Then place the outer bishop in line with the other two pieces, then walk the king through the wall to the side opposite Black's king."

Rule r9 derives its stage from the board rather than stored history and applies whenever its geometry qualifies, regardless of the phase label:

1. From the smallest adjacent diagonal wall or walls that strictly enclose Black and also contain White, find the two orthogonally adjacent squares immediately inside the inner bishop's diagonal. Use the square with the greater squared Euclidean distance from Black as the staging square, and minimize White's king-step distance to it.
2. Once White reaches a staging square, keep the inner bishop fixed and prefer moving the outer bishop to the square immediately beyond the inner bishop, producing a straight three-square line with White's king.
3. Once that line exists, advance White's king across the same diagonal wall toward the side opposite Black. Stop applying r9 once White is strictly beyond the outer diagonal.

In `8/8/8/1k6/8/4B3/2K3B1/8 w - - 0 1`, the staging square is `e2`; the intended milestones are White king `e2`, `Be4`, `Kf3`, and `Kf4`.

## Rule r7

Text: "With bishops on enclosing phase 2 diagonals, prefer king proximity to a square a knight's move from Black's corner."

For each qualifying starting corner, find its two on-board knight-move squares and score candidate results by White king's minimum king-step distance to either square. Use the best distance if more than one starting corner qualifies. Bishop placement is not a tie-break in r7.

## Rule r5

Text: "Prefer the Black king enclosed in a 2-square cage, then prefer king proximity to a square in line with the bishops, closer to the edge."

Treat squares not controlled by either bishop as a king-move graph. A candidate result has a 2-square cage when the connected component containing Black has exactly two squares and the bishops occupy orthogonally adjacent squares. Score candidates lexicographically: first prefer results with such a cage, then, among caged results, extend the bishops' line one square beyond either end, retain on-board candidates, select the candidate or candidates with minimum edge distance, and minimize White king's king-step distance to those targets. Candidates without a cage receive a cage penalty and a neutral distance score.

The r5 cage geometry is independent of Phase 2 and is invariant under rotation and reflection. The previous `c3/d3`, Black `c1/d1`, target `b3` pattern remains one valid instance rather than the complete definition.

## Rule r4

Text: "Once rule r5 has been achieved, follow the mating pattern: control the escape square, then check, sometimes using a waiting move."

Rule r4 precedes r5. It is neutral until a known mating-pattern branch is reached. Every recognized r4 position must lie in a finite branch whose every legal Black reply reaches checkmate; a cycle or non-mating leaf is an implementation bug. The first branch is the supplied line from `8/8/2K5/k1B5/2B5/8/8/8 w - - 20 11`: r4 plays `Bb3`; after `Ka6`, r4 prefers `Bb4`; after `Ka7`, `Kc7`. Black may then play `Ka6`, met by `Bc4+`, or `Ka8`, met by `Bc4` and forced `Ka7`; both lines rejoin at `Bc5+ Ka8 Bd5#`. The ordinary mate priority remains above r4.

Match each branch position and result structurally, ignoring FEN move counters, and accept every rotation and reflection. At a recognized branch position, the supplied result receives no r4 penalty and every other result receives one. At an unrecognized position, r4 is neutral so later rules decide. Future branch additions extend this same position-to-result table.

At a recognized r4 position, r4 defines the complete accepted move set. Rules r5 and later are inapplicable there, so they cannot narrow an intentionally multi-move r4 result. Mate, bishop safety, and stalemate prevention remain higher priorities.

The post-r5 position `2K5/2B5/k1B5/8/8/8/8/8 w - - 2 2` is a recognized waiting stage. Prefer `Ba4`, `Bd7`, `Be8`, or `Bd8`; each preserves the adjacent walls without exposing a bishop and forces `Ka7`. Then `Bb5` forces `Ka8`. Prefer every bishop wait that forces `Ka7` and admits a checking move that forces `Ka8` followed by immediate mate. Register the complete finite continuation and recognize it under every rotation and reflection.

In `8/k1K5/2B5/8/1B6/8/8/8 w - - 4 3`, r4 uniquely selects `Bb5`, forcing `Ka8` and reaching the waiting stage.

A preceding trigger is `8/2K5/2B5/k1B5/8/8/8/8 w - - 0 1`. The bishop on `c6` controls Black's escape square `b5`; r4 uniquely selects `Bd6`. After forced `Ka6`, the shifted continuation uniquely selects `Bb4`, forcing `Ka7`, and then `Bb5`, forcing `Ka8`.

The shifted continuation `8/2K5/k1BB4/8/8/8/8/8 w - - 2 2` is an acceptable instance of the GIF's `Bb4` pattern. Rule r4 uniquely prefers `Bb4` from this position and from every rotation or reflection of it.

The predecessor `8/2K5/k1B5/2B5/8/8/8/8 w - - 0 1` also uniquely selects `Bb4`. Black's forced `Ka7` reaches the already-registered `Bb5` continuation. Recognize this predecessor under every rotation and reflection.

After `1. Kc8 Ka7` from `8/2BK4/k1B5/8/8/8/8/8 w - - 0 1`, the position `2K5/k1B5/2B5/8/8/8/8/8 w - - 2 2` is another r4 predecessor. It uniquely selects `Bb5`, which forces `Ka8` and reaches the registered waiting/check/mate finish. Recognize it under every rotation and reflection.

After `Bb5 Ka8`, accept `Kc8` or any legal bishop move that keeps the bishops on the diagonals `a5`–`e1` and `a6`–`f1`, except `Ba6`. The canonical waiting set is `Kc8`, `Ba5`, `Bc3`, `Bd2`, `Be1`, `Bc4`, `Bd3`, `Be2`, and `Bf1`. Every waiting move forces `Ka7`. Generate the next checking move so it forces `Ka8`, then generate every immediate checkmate. For the supplied branch this yields `Bc3 Ka7 Bd4+ Ka8 Bc6#`; the other eight waiting choices receive their corresponding forced check-and-mate continuations. Expand the entire finite branch through all rotations and reflections.

Display the complete supplied line as a looping animated rule diagram, including the r5 entry move and every Black reply.

## Rule r15

Text: "Prefer king proximity."

Compare White-to-Black king proximity by squared Euclidean distance. Bishop moves preserve White's current king square. Thus, from `1k6/3K4/8/1BB5/8/8/8/8 w - - 2 2`, `Kd6` has distance eight while a bishop move such as `Bb5` preserves distance five, so `Kd6` loses.

## Rule order

The policy order is: mate, bishop safety, no stalemate, r4, r5, r7, r9, r10, r12, r15.

## Diagram

Display the supplied canonical position `k7/2KB4/3B4/8/8/8/8/8 w - - 2 2`. Do not highlight any squares.

## Verification

Focused tests cover all four canonical Black edge squares, both bishop diagonals, arbitrary White king positions, all rotations/reflections, rejection of formation deviations, r7's transformed corner and knight-square distance including the `Kb6` regression, r9's phase-independent staging, alignment, and two-step wall crossing under symmetry, r10's result-only wall scoring, r5's candidate-result cage creation priority, generic two-square cage, nearer-edge target, legacy instance, and symmetry, r4's full supplied branch, symmetry, neutrality outside known branches, exact animated frames, r15's squared Euclidean comparison, the diagram, and exact rule order/text. Then run the exact early-exit search from UI-valid roots, orient the first valid loop so Black starts closest to `a7`, and load it at cursor 0.
