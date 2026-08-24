# Two Bishops Short Phase 2 Mate Branch Design

## Goal

Recognize the family of forced continuations reached after the eight Rule A
moves that permit `Bf4+` after `…Kh2`:

`Bf4+ Kh1`, followed by the unique mating bishop move.

This is a valid short mate-in-8-ish branch and must outrank the Phase 1 fallback rules.

## Design

- Add the eight exact branches and all rotations/reflections to the Phase 2 pattern graph.
- Register only the audited continuations; do not broaden generic checking-move acceptance. `Bb2` and `Ba3` remain excluded because `Bf4+` is unavailable from those positions.
- Keep the existing flow labels and diagrams unchanged.
- Verify that `Bf4+` is ideal with reason `mate in 8 ish`, Black's `Kh1` is uniquely ideal, and the resulting mating move is unique.

## Validation

- Add canonical branch coverage and symmetry coverage.
- Run the focused Phase 2, policy, and wall-geometry tests, plus build and lint.
- Generate, independently validate, and load the next loop at `cursor=0`.
