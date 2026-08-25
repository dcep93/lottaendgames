# Two Bishops Three-Rule Reset

## Goal

Reset two-bishops training to a compact two-phase policy with a fixed Training Wheels position and twelve White move preferences.

## Training position

Training Wheels starts from `8/6B1/6B1/8/7k/8/8/1K6 w - - 0 1`: Black king on h4, White bishops on g7 and g6, and White king on b1. Training may use its rotations and reflections.

Phase 2 requires control of a long corner diagonal and its parallel diagonal one step inward, with both kings enclosed on the inward side. Other nonterminal positions are Phase 1. This definition is displayed in the training notes.

## White rule order

1. **rule a** — Prefer Phase 2.
2. **rule e5** — In Phase 2, force Black to move along the edge towards the corner it is caged in.
3. **rule e6** — Phase 2: If Black is one edge square from the caged corner and the square two beyond Black from that corner is bishop controlled, prefer White-king proximity to the knight-move square from the corner that is not adjacent to Black's edge.
4. **rule e8** — Phase 2: Force Black to move along the edge towards a controlled square or its caged corner.
5. **rule f5** — In Phase 2, when Black is on an edge within two edge-squares of the enclosed corner and a bishop controls an edge square two or three steps from that corner, prefer White king proximity to the knight-move square from the corner that is not adjacent to the edge containing that controlled square.
6. **rule f** — Phase 2: Prefer White king proximity to the square two diagonal steps inward from Black's enclosed corner, within two king-steps of Black's king.
7. **rule g** — Prefer a bishop to control a corner without occupying one.
8. **rule j** — Without passage through the long diagonal, control a diagonal adjacent to the controlled corner diagonal, combining to enclose Black's king.
9. **rule m** — Prefer White's king off the edge.
10. **rule r** — Prefer smaller squared Euclidean distance between the kings.
11. **rule s** — In Phase 2, when moving an attacked bishop, prefer the destination with maximum squared Euclidean distance from Black's king.
12. **rule w** — Phase 2: With Black on an edge, prefer the moved bishop to control a square on Black's edge as close as possible to the enclosed corner, approaching that edge from the opposite corner's diagonal direction, but not the corner until mate.
13. **rule x** — In Phase 2, prefer the greater sum of both bishops' Euclidean distances from Black's king.
14. **rule z** — In Phase 1, prefer the outer bishop of the resulting bishop wall adjacent to White's king. The outer bishop is the bishop controlling the wall diagonal farther from the caged corner.

Normal legality and checkmate handling remain authoritative. No other White tie-breakers participate.

## Geometry

A corner diagonal is `a1–h8` or `a8–h1`. A bishop controls one when it lies on it and the line is not interrupted by another piece.

An adjacent diagonal is the immediately neighboring parallel diagonal. Rule J applies only when the existing corner diagonal and candidate adjacent diagonal put Black's king on the corner side of the pair, and the White move is not check.

The bishop on that adjacent diagonal is the inner bishop. A position is Phase 2 when White's king is beyond the inner diagonal on the same enclosed side as Black's king.

Rule E5 is satisfied only when every legal Black reply remains on Black's current edge and strictly reduces its distance to the corner enclosed by the bishop cage before White moves. The cage corner is derived from the controlled corner diagonal, its adjacent inner diagonal, and the side containing Black; it is not whichever edge endpoint happens to be nearest Black, and White cannot change the target by rebuilding the cage toward another corner.

Rule E6 applies only in Phase 2. Black must be exactly one square from the caged corner along an edge, and the edge square two steps beyond Black away from that corner must be controlled by a bishop. Of the two squares a knight's move from the corner, the target is the one not adjacent to Black's current edge. White minimizes squared Euclidean distance to that target.

Rule E8 applies only to resulting Phase 2 positions. It is satisfied when every legal Black reply remains on Black's current edge and moves strictly closer to either a White-controlled edge square or the caged corner. Different replies may approach different valid targets.

Rule F5 activates in Phase 2 when Black is on an edge meeting the enclosed corner, no more than two edge-squares from it, and a bishop already controls an edge square two or three steps from the corner (`h1 → h3/h4` on the h-file, `h1 → f1/e1` on the first rank). White-king control alone does not activate the rule. The bishop-controlled square determines the relevant edge. Of the two knight-move squares from the corner, Rule F5 excludes the one adjacent to that edge and minimizes White king's squared Euclidean distance to the other. Thus when a bishop controls `h3` in the `h1` cage, `g3` is excluded and `f2` is the target.

Rule F derives the square two diagonal steps inward from the cage corner (`h1 → f3`, `h8 → f6`, `a1 → c3`, `a8 → c6`). It first prefers resulting White king squares no more than two king-steps from Black's king, then minimizes squared Euclidean distance to the target.

Rule W evaluates the resulting bishop pair. Black has one active edge: away from the corner it is the edge Black occupies; in the corner it is the unique edge containing Black's legal edge route before White moves. Rule W follows diagonals parallel to the line from the opposite corner and scores the closest controlled intersection with that active edge, excluding the corner itself. A bishop occupying an edge square does not control its own square. A bishop move must itself retain a qualifying intersection; controlling only the corner or only another edge is nonqualifying. Thus `Be5 → h2` improves on the existing `h3` control, `Bg7 → h6` merely leaves the other bishop's `h3` control in place, and `Bg6` is rejected because the resulting pair's nearest qualifying control regresses from `h3` to `h4`.

## Verification

- Assert the exact Training Wheels FEN and Phase 1 label.
- Assert the visible White rule list is exactly A, E5, E8, F5, F, G, J, R, S, W in that order.
- Test G's corner-diagonal and non-corner preference.
- Test J's adjacency, enclosure, and no-check requirements.
- Test the Phase 2 boundary against the controlled outer and inner diagonals.
- Test E5 and E8 against all legal Black replies.
- Test R with squared Euclidean king distance.
- Run focused tests, build, lint, and the loop verifier; load the next unresolved loop at cursor 0.
