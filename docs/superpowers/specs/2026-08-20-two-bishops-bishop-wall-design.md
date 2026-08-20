# Two Bishops Bishop Wall Design

## Goal

Add a `bishop wall` priority immediately before `onsides`:

> **bishop wall** — Achieve the bishop wall position.

The canonical result is the position after `Be4` from `8/8/5K2/8/6k1/3BB3/8/8 w - - 24 13`: White king `f6`, Black king `g4`, and White bishops `e4` and `e3`.

## Geometry

Treat the complete four-piece relationship as the bishop-wall position. Relative to White's king in the canonical orientation, Black's king is `(1, -2)` and the bishops occupy `(-1, -2)` and `(-1, -3)`. Match the bishops without regard to which bishop is listed first.

Generate every valid instance by applying all eight board rotations/reflections to those relative offsets and translating the transformed pattern anywhere it fits on the board. Evaluate the resulting position after White's move. Merely placing the bishops on adjacent squares is insufficient when the kings do not share the canonical transformed relationship.

## Priority and Presentation

Register `bishop wall` after `central king` and immediately before `onsides`. It applies when at least one legal White move reaches the wall and categorically prefers exactly those moves.

Add a note-board diagram titled `bishop wall` showing the supplied position after `Be4`: White king `f6`, Black king `g4`, bishops `e4/e3`. The diagram is illustrative; the evaluator derives rotations, reflections, and translations mechanically.

## Verification

Add focused tests for the exact rule order and copy, unique selection of `Be4`, all rotations/reflections, a translated instance, rejection of adjacent bishops with mismatched king geometry, and the generated diagram. Run only focused Two Bishops tests, diagram validation, and a bounded loop verifier. Before delivery, load a verified local loop at `cursor=0` and confirm the sidebar starts at its FEN.

## Assumptions

- “Bishop wall position” means the complete four-piece geometry shown after `Be4`, not every orthogonally adjacent bishop pair.
- The rule applies in both phases because no phase restriction was requested.
