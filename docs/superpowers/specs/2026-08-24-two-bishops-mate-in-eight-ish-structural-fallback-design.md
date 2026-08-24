# Two Bishops Mate-in-8-ish Structural Fallback Design

## Goal

Extend `mate in 8 ish` beyond the explicit lettered sequences without reducing
their priority. A legal White move may enter the rule through a
rotation/reflection-equivalent structural result even when its starting
position is not one of the exact sequence stages.

In the canonical `h1` orientation, a qualifying result has:

- White's king on `f2`, a knight's move from `h1`.
- Black's king on `h1` or `h2`, the corner's two edge squares.
- a White bishop controlling `h3`, the edge square two steps from the corner;
  `h3` must not contain a bishop and must not be adjacent to White's king.
- a legal one-move bishop route onto the `b8-h2` diagonal.

## Selection

Keep the existing exact lettered/GIF matcher unchanged and evaluate it first.
If it returns any moves, those moves remain the only `mate in 8 ish` choices.
Only when no exact move matches should the rule evaluate all legal White moves
by their resulting positions and accept every result satisfying the structural
predicate. This makes the structural entry a true fallback rather than an
equal alternative to a demonstrated continuation.

Apply the predicate through all board rotations and reflections. Determine the
canonical corner, its two edge squares, the two-steps edge target, and the
future diagonal through the same transform so that no orientation-specific
logic is duplicated.

## Verification

- From `8/8/8/6B1/6B1/8/5K2/7k w - - 16 9`, verify qualifying setup moves,
  including `Bf5`, are selected by `mate in 8 ish`.
- Verify a bishop occupying `h3` is rejected.
- Verify a result where `h3` is adjacent to White's king is rejected.
- Verify a result with no legal bishop move onto `b8-h2` is rejected.
- Verify a rotated/reflected equivalent is accepted.
- Verify an existing exact sequence stage still selects only its exact move.
- Run the focused policy tests, build, and lint, then load a validated loop at
  `cursor=0` with Black's nearest corner oriented to `h1`.
