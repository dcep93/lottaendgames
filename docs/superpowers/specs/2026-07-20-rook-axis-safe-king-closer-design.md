# Rook axis-safe king approach

## Goal

Choose `Rh3` from
`8/8/8/8/2K5/2R5/8/1k6 w - - 0 1` because `Kd3` increases the
horizontal distance between the kings. The correction must be geometric and
symmetry-safe, without a FEN, square, orientation, or box-size exception.

## Visible rule

Display:

> **king closer** — Move White's king closer without moving farther away
> horizontally or vertically.

## Evaluator

For each candidate, compare the absolute horizontal and vertical distances
between the kings before and after the move. Give the candidate an axis-
regression penalty when either resulting distance is larger than its starting
distance.

Inside the existing `king closer` priority, compare in this order:

1. avoid axis regression;
2. minimize resulting king-move distance; then
3. minimize resulting row-plus-file distance.

A Rook move leaves both King-axis distances unchanged and therefore has no
regression penalty. A King move may improve one axis only if it does not worsen
the other. The rule remains symmetric under every board rotation and
reflection; neither horizontal nor vertical distance is preferred over the
other.

In the supplied position, `Kd3` improves vertical distance but worsens
horizontal distance, so it loses at `king closer` to box-preserving Rook moves.
The later `rook farther` priority selects `Rh3`.

## Verification

- Assert the exact visible rule copy.
- Pin `Rh3` as the sole best move in the supplied position and assert that
  `Kd3` is rejected by `king closer`.
- Assert the before/after axis distances and regression score directly.
- Retain a King move that improves one axis without worsening the other,
  proving valid King approach still wins when appropriate.
- Verify the supplied position across all D4 rotations and reflections.
- Run focused Rook rules, the exact identity-keyed Rook verifier, session and
  presentation tests, lint, and the production build.
- If exhaustive verification still finds a cycle or 50-move draw, report one
  shortest replay from its minimal cycle or draw boundary.
