# Two Bishops A-file Mate-in-8-ish Design

## Goal

Recognize the supplied eight-move finish and its rotations/reflections as a
`mate in 8 ish` branch:

`Kc3 Ke1, Bb5 Kd1, Bf2 Kc1, Be2 Kb1, Kb3 Kc1, Be3+ Kb1, Bd3+ Ka1, Bd4#`.

The two bishops occupy the `a7-g1` and `a6-f1` wall diagonals. Move 2 may be a
non-checking bishop waiting move that preserves both diagonals and still leaves
the later normalization moves available. Move 4 places the outer-wall bishop
to control `d1`; move 5 places the king to control `a2`. The last three White
moves are the specified check, check, and checkmate sequence.

## Implementation

- Add a small local stage matcher keyed by king geometry and the two wall
  diagonals; do not restore the removed runtime mate-pattern graph.
- Expand the canonical geometry through all board rotations and reflections.
- Normalize the flexible waiting move back into the exact finishing geometry
  before the final checking sequence.
- Give the branch a `mate in 8 ish` priority immediately after the three safety
  priorities, ahead of the generic Phase 2 rules.

## Verification

- Verify all eight supplied White moves are selected by `mate in 8 ish`.
- Verify move 2 accepts a legal alternative waiting move that preserves both
  wall diagonals and rejects one that changes a wall diagonal.
- Verify rotations and reflections.
- Run the focused policy test, build, and lint.
- Independently validate and load a loop at `cursor=0`, oriented with Black's
  nearest corner at `h1`.
