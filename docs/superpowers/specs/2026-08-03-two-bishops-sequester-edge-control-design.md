# Two Bishops Sequester Edge Control Design

## Goal

Make `Bd2` correct in `8/k7/2K4B/8/8/8/8/7B w - - 0 1` because it controls `a5`, preventing Black from continuing away from the target corner after `...Ka6`.

## Rule

Render:

> **sequester** — Phase 2: Force Black's king towards the target corner, or otherwise use a bishop to control the square 2 away from Black's current square.

Keep immediate forced progress toward the fixed target corner as the first comparison. If at least one safe candidate reduces Black's worst-reply distance from its current distance to the target corner, retain every candidate tied for that best progress and skip the two-away comparison entirely. This lets later visible rules distinguish successful sequestering moves.

Only when no safe candidate reduces that distance, prefer a resulting bishop position that controls either on-board edge square exactly two steps from Black's current square. There is no hidden direction relative to the target corner. If neither square is on-board, the comparison is neutral.

The calculation uses only the current board and resulting candidate board, preserves D4 symmetry, and does not inspect move history.

## Verification

- Assert `Bd2` is uniquely recommended in the supplied position and controls `a5`.
- Assert every D4 transform recommends the transformed move and controls the transformed square.
- Assert that `Kf2` survives sequester when it and another candidate both force `...Kh1`; the two-away fallback must not break that successful-progress tie.
- Assert that `Be4` is uniquely recommended in `8/6BB/8/8/5K2/7k/8/8 w - - 0 1` because it controls `h1`, one of the two possible edge squares exactly two steps from Black on `h3`.
- Run focused Two Bishops rules and directly affected presentation tests, TypeScript, diagram checks, and `git diff --check`.
- Run the fail-fast Two Bishops development search and report one refreshable localhost loop without browser validation.
