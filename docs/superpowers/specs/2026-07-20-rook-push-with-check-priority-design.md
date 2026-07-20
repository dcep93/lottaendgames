# Rook push-with-check priority

## Goal

Make the Rook evaluator choose `Rh2+` from
`8/8/8/8/K7/7R/k7/8 w - - 0 1` for the same concise rule shown to the
player: a safe check that forces every Black reply farther from White's King
should take precedence over preserving the current box or making a waiting
move.

## Design

Keep the existing `push with check` rule and its copy unchanged. Move it ahead
of `establish box` and `waiting move` in the ordered Rook priorities. The full
order becomes:

1. `mate`
2. `pieces safe`
3. `no stalemate`
4. `rook escape`
5. `push with check`
6. `establish box`
7. `waiting move`
8. `king closer`
9. `rook farther`

Do not add a position-specific exception, a box-size exception, or a hidden
algorithmic tie-break. `Rh2+` qualifies under the existing general definition:
after the check, every legal Black reply increases Black's king-move distance
from White's King.

## Verification

- Add a focused fixture asserting that `Rh2+` is the sole ideal move and that
  `Rb3` is rejected by `push with check`.
- Update snapshots and deterministic expectations affected by the priority
  reorder.
- Exhaustively enumerate the identity-keyed Rook policy graph and report a
  minimal directly playable cycle if one exists.
- Run the exhaustive Rook proof with the 50-move rule enabled. Success requires
  no reachable repetition and no 50-move failure for any legal Black reply
  after any selected White move.
- Run the complete test suite, lint, and production build.
