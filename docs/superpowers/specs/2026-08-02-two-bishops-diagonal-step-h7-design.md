# Two Bishops Diagonal Step h7 Extension

## Goal

Allow the existing Diagonal king step Degenerate repair when Black's king is on canonical `h7` as well as `h6`.

## Geometry

In the canonical orientation:

- Black's king is on `h6` or `h7`.
- White's king is on `f5`.
- The dark-squared bishop is on `f6`.
- The light-squared bishop occupies the `e8–h5` diagonal.
- The repair is `Kf5–e6` when legal.

Recognize only the eight board-wide D4 rotations and reflections. Do not permit translations or any additional Black-king squares.

## Verification

- Cover `h6` and `h7` across all four approved diagonal squares.
- Preserve all eight board-wide D4 symmetries.
- Confirm the supplied `h7` position recommends `Ke6` with reason `degenerate — diagonal king step`.
- Preserve rejection of the translated lookalike.
- Run focused Degenerate tests, targeted TypeScript and diff checks, then the fail-fast loop gate.

