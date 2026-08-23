# Rule A Vacated King Target Fix

## Goal

Allow Rule A to recognize a necessary bishop move when that bishop occupies the viable knight-move target for White's king.

## Behavior

Before White's king reaches a Rule A target, a bishop move receives preparatory credit when it moves a bishop off such a target, leaves the target empty, and White's king is one legal king step from it. This credit ranks below reaching the target immediately but above unrelated king and bishop moves. Later priorities may distinguish multiple legal ways to vacate the target.

For `8/8/8/8/8/5KB1/8/3B2k1 w - - 0 1`, the bishop on `g3` blocks the viable target `g3`. Vacating it is necessary, and the remaining priorities select `Bh4`.

## Verification

- Assert `Bh4` is the unique ideal move in the reported position.
- Assert rotations and reflections preserve the result.
- Preserve the existing Rule A stage tests.
- Run the focused Two Bishops tests, build, diagram check, and fast loop verifier.
