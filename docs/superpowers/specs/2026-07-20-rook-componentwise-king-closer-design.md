# Rook componentwise king approach

## Goal

Define `king closer` directly through horizontal and vertical distance: reduce
at least one axis without increasing either axis. This must choose `Kg6` from
`7k/R7/5K2/8/8/8/8/8 w - - 2 2` and remain symmetric under every rotation and
reflection.

## Visible rule

Display exactly:

> **king closer** — Move White's king closer to Black's king.

## Evaluator

For each candidate King move, compare the absolute file and rank distances
between the kings before and after the move. The King move is productive when:

- at least one resulting axis distance is strictly smaller; and
- neither resulting axis distance is larger.

Rank candidates inside `king closer`:

1. a productive King move;
2. a neutral Rook move; then
3. a King move that improves neither axis or increases either axis.

Within a tier, retain the existing resulting king-move-distance and
row-plus-file-distance comparisons. The productive test treats file and rank
identically and therefore introduces no orientation preference.

This supersedes the strict king-move-distance requirement. In the supplied
position, `Kg6` reduces horizontal distance and leaves vertical distance
unchanged, so it is productive. In the prior
`8/8/8/8/2K5/2R5/8/1k6 w - - 0 1` position, `Kb4` likewise reduces one axis
without increasing the other and therefore supersedes the prior `Rh3` choice.
`Kd3` remains unproductive because its horizontal distance increases.

## Verification

- Assert the exact visible rule copy.
- Pin `Kg6` as the sole best move in the supplied position.
- Assert the before/after componentwise result for `Kg6`, `Kb4`, and `Kd3`.
- Update the previous `Rh3` regression to `Kb4` while retaining `Kd3` rejection
  by `king closer`.
- Verify both source positions across all D4 rotations and reflections.
- Run focused Rook rules, the exact identity-keyed Rook verifier, session and
  presentation tests, lint, and the production build.
- If exhaustive verification still finds a cycle or 50-move draw, report one
  shortest replay from its minimal cycle or draw boundary.
