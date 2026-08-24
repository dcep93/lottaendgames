# Two Bishops Short Phase 2 Mate Branch Design

## Goal

Recognize both families of forced continuations reached after the sixteen Rule A
moves that permit a checking bishop move after Black's first reply:

`Bf4+` or `Be3+`, `…Kh1`, followed by the unique mating bishop move.

This is a valid short mate-in-8-ish branch and must outrank the Phase 1 fallback rules.

## Design

- Add the sixteen exact branches and all rotations/reflections to the Phase 2 pattern graph.
- Register only the audited continuations; do not broaden generic checking-move acceptance. The two non-checking choices in each family remain excluded.
- Keep the existing flow labels and diagrams unchanged.
- Verify that `Bf4+` is ideal with reason `mate in 8 ish`, Black's `Kh1` is uniquely ideal, and the resulting mating move is unique.

## Validation

- Add canonical branch coverage and symmetry coverage.
- Run the focused Phase 2, policy, and wall-geometry tests, plus build and lint.
- Generate, independently validate, and load the next loop at `cursor=0`.
