# Two Bishops Short Phase 2 Mate Branch Design

## Goal

Recognize the forced continuation reached after `Be6 Kh2`:

`Bf4+ Kh1 Bd5#`

This is a valid short mate-in-8-ish branch and must outrank the Phase 1 fallback rules.

## Design

- Add the exact branch and all rotations/reflections to the Phase 2 pattern graph.
- Register only the three verified plies from the supplied position; do not broaden generic checking-move acceptance.
- Keep the existing flow labels and diagrams unchanged.
- Verify that `Bf4+` is ideal with reason `mate in 8 ish`, Black's `Kh1` is uniquely ideal, and `Bd5#` is the unique mate.

## Validation

- Add canonical branch coverage and symmetry coverage.
- Run the focused Phase 2, policy, and wall-geometry tests, plus build and lint.
- Generate, independently validate, and load the next loop at `cursor=0`.
