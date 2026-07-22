# Two Bishops Static Completion Policy

## Goal

Make the Two Bishops teaching policy terminate from every supported legal starting position without repetition or a 50-move draw. Every decision must depend only on the current board. The modal must explain the same priorities the evaluator uses.

## Rejected Approaches

- Move-history and repetition penalties are not allowed because a human cannot infer them from the current board.
- Tablebase distance, shortest mate, and hidden search tie-breaks are not allowed because they cannot produce an honest human-facing reason.
- Position-specific FEN or square exceptions are not allowed because they do not teach reusable technique.

## Strategy

Use a position-based geometric progress ladder. Keep the universal safety rules first, preserve phase 2 once reached, and express each phase-two maneuver as a visible board relationship. Every new exhaustive counterexample must be fixed by generalizing a position class, tested under all eight rotations and reflections, and described in the modal.

For a supported corner, apply these waiting ideas in order:

1. If a bishop occupies the corner edge closest to White's king, move that bishop off the edge or move White's king to the other support square.
2. If the bishops can be brought together safely without checking, bring them together.
3. Otherwise, make a non-checking move with the bishop on the same square color as the corner. Existing later priorities place that bishop as far from the corner as possible.

The third step changes `1. Bc3+` to `1. Bh6` in `4B3/8/8/8/8/1K6/3B4/k7 w - - 0 1`.

## Modal Standard

Rule titles remain short and lowercase. Explanations must:

- say what visible condition activates the rule;
- say which piece should move and what geometric result to seek;
- avoid history, implementation language, mate distance, and unexplained phrases such as “advance the setup”;
- match the evaluator exactly, including the order of alternatives.

The `waiting move` explanation may contain several sentences because it covers distinct visible phase-two formations, but each sentence must state one recognizable condition and action.

## Iteration and Proof

After each rule change:

1. Add a focused regression for the reported position and the rejected looping move.
2. Run the regression under all eight board symmetries.
3. Run lint, the focused Two Bishops test file, and the production build.
4. Run the exhaustive Two Bishops verifier.
5. If it reports another cycle or 50-move line, reduce it to its minimal cycle, inspect the board geometry, and add the smallest general teaching rule that makes genuine progress.

Completion requires the exhaustive verifier to pass with no cycle and no 50-move failure. The final modal copy and tests must still match the resulting policy.
