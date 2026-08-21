# Two Bishops Bishop Wall Design

## Goal

Add a `bishop wall` priority immediately before `onsides`:

> **bishop wall** — Achieve the bishop wall position.

The canonical example is the position after `Be4` from `8/8/5K2/8/6k1/3BB3/8/8 w - - 24 13`: Black king `g4`, White bishops `e4` and `e3`, and White king `f6`.

## Geometry

Treat a position as a bishop wall when the bishops are adjacent, both bishops are within three king-steps of Black's king, at least one bishop is exactly two king-steps from Black's king, and White's king is exactly two king-steps from Black's king. Black's king must remain off the edge. Accept either of these moat-facing shapes:

- One bishop is in two-square orthogonal opposition to Black's king, and the bishops' adjacency axis is perpendicular to that opposition axis.
- The kings are in two-square orthogonal opposition, one bishop is on the midpoint king moat, and the other bishop is one square toward White along the axis perpendicular to the moat.

Evaluate the resulting position after White's move. Preserve the existing opposition-based shape while adding the king-moat shape exemplified by Black king `c5`, White king `e5`, and bishops `d3/e3`.

## Priority and Presentation

Register `bishop wall` after `central king` and immediately before `onsides`. It applies when at least one legal White move reaches the wall and categorically prefers exactly those moves.

Add a note-board diagram titled `bishop wall` showing the supplied position after `Be4`: Black king `g4`, bishops `e4/e3`, no White king, and pink White-king targets `f6/g6`. The diagram is illustrative; the evaluator derives rotations, reflections, and translations mechanically.

## Verification

Add focused tests for the exact rule order and copy, unique selection of `Be4`, all rotations/reflections, a translated instance, the added `Kc5/Ke5/Bd3/Be3` king-moat shape, rejection of walls with either bishop more than three king-steps from Black, rejection of walls whose bishops are both three king-steps from Black, rejection of adjacent bishops with mismatched king geometry, and the generated diagram. Run only focused Two Bishops tests and a bounded direct policy check.

## Assumptions

- “Bishop wall position” means either complete four-piece geometry above, not every orthogonally adjacent bishop pair.
- The rule applies in both phases because no phase restriction was requested.
