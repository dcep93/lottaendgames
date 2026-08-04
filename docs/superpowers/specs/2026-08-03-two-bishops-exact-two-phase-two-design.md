# Two Bishops Exact-Two Phase 2

## Definition

Render:

> Phase 2: Black's king forced to the edge, White's king two squares away from Black's edge.

For a Black king on an edge, White's king is in the Phase 2 line only when its coordinate is exactly two squares inward from that edge. At a corner, exact alignment with either occupied edge qualifies so the knight's-move mating setup remains Phase 2.

## Turn semantics

- On Black's turn, Phase 2 requires the current board to have the exact-two king alignment and every legal Black king move to remain on an edge.
- On White's turn, Phase 2 requires at least one legal White move whose result has the exact-two alignment and forces every legal Black king move to remain on an edge.
- Classification is current-board-only, ignores FEN counters, and remains D4 symmetric.

## Required example

`4k3/8/4BB2/8/8/5K2/8/8 w - - 0 1` is Phase 1. White's king on `f3` is five ranks from Black's eighth-rank edge, and `Ke4` still does not reach the exact-two line. Therefore Phase 2 rules such as `sequester` cannot own `Ke4`.

## Verification

Add the supplied position and D4 transforms, exact-two positive and near/far negative fixtures, Black-turn and White-turn semantics, rendered-copy checks, TypeScript, diagram consistency, diff checks, and the fail-fast loop search.
