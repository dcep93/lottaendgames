# Two Bishops Rule N: Four-Diagonal Threshold

## Goal

Update Rule N to:

> **rule n** — With a bishop wall and White's king controlling the escape square, shrink and check along the bishop wall, from at least 4 diagonals from the corner.

## Design

- Preserve Rule N's existing Manhattan destination-to-corner measurement.
- Raise the minimum checking-bishop destination distance from three to four.
- Preserve the requirements that Rule N starts from the tightest controlled wall, shrinks that wall strictly, and keeps the same diagonal axis across every legal Black reply.
- `Be1+` from `8/8/8/5K2/7k/8/3B4/3B4 w - - 0 1` is rejected because `e1` is three Manhattan steps from `h1`.
- Preserve rotations and reflections.

## Verification

- Pin the exact rendered Rule N text.
- Replace distance-three acceptance with rejection coverage.
- Add distance-four acceptance and symmetry coverage.
- Run focused tests, build, lint, and diff checks.
- Validate and load the next structural loop at `cursor=0`.
