# Two Bishops Static Completion Policy

## Goal

Make the Two Bishops teaching policy terminate from every theoretically winning supported starting position without repetition or a 50-move draw. Every decision must depend only on the current board. The modal must explain the same priorities the evaluator uses.

Some legal KBBK positions are already drawn. For example, White may have to choose between moving an attacked bishop and causing immediate stalemate or losing that bishop on Black's next move. No policy can force mate from such a root. Standard generation and exhaustive root enumeration must reject these positions, while the verifier must continue treating the same outcome as a failure if the policy reaches it from a winning root.

## Rejected Approaches

- Move-history and repetition penalties are not allowed because a human cannot infer them from the current board.
- Tablebase distance, shortest mate, and hidden search tie-breaks are not allowed because they cannot produce an honest human-facing reason.
- Position-specific FEN or square exceptions are not allowed because they do not teach reusable technique.

## Strategy

Use a position-based geometric progress ladder. Keep the universal safety rules first and express each phase-two maneuver as a visible board relationship. Special waiting maneuvers come before `keep phase two`, because preserving the mating net can require a bishop-wall move whose Black replies temporarily fall outside the phase label. Every new exhaustive counterexample must be fixed by generalizing a position class, tested under all eight rotations and reflections, and described in the modal.

When the kings are a knight's move apart, use these waiting ideas:

1. Away from a supported corner, if the bishops are together and a safe one-square move toward the center preserves phase 2, make that move.
2. Otherwise, make a non-checking bishop move that places the bishops as close together as possible. This preserves the bishop wall instead of following Black sideways with White's king.

When Black is one edge-square from a corner, use a bishop move that forces every legal Black reply into that corner. If possible, place the bishop on an edge that meets at the corner to prepare the next check. This corner-forcing move comes before moving White's king toward corner support; if both checking and quiet moves work, the later `check king` priority chooses the check.

For a supported corner, apply these waiting ideas in order:

1. If every nearest corner-support square for White's king is occupied by a bishop, move the blocking bishop out of the way.
2. If a bishop occupies the corner edge closest to White's king, move that bishop off the edge or move White's king to the other support square. A forcing check is allowed when it clears the edge.
3. If the bishops can be brought together safely without checking, bring them together.
4. Otherwise, make a non-checking move with the bishop on the same square color as the corner. Place it as far as possible from both edges that meet at the corner: maximize its distance from the nearer edge.

The third step changes `1. Bc3+` to `1. Bh6` in `4B3/8/8/8/8/1K6/3B4/k7 w - - 0 1`. It also chooses `Bh6` instead of the edge-hugging `Bh2` in `4B3/8/8/8/5B2/1K6/8/k7 w - - 0 1`.

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

## Winning Root Boundary

A generated Two Bishops root is eligible only if White has at least one legal first move that checkmates or leaves a non-terminal position where every legal Black reply retains both bishops. This position-only test rejects immediate, unavoidable capture-or-stalemate draws without weakening verification after play begins.
