# White-Turn Phase Display Design

## Goal

Keep the board's phase badge tied to White's decision point. Black's reply
must not cause the displayed phase to be recalculated.

## Behavior

- When the current position is White to move, calculate the phase from the
  current FEN.
- When the current position is Black to move, display the phase recorded for
  the White move that produced that position.
- Undo and redo continue to operate by half-move. Because the existing
  Black-to-move history snapshot contains the pending White log, restoring a
  snapshot also restores the correct phase without adding session state.
- If a session starts from a Black-to-move FEN and has no preceding White log,
  display an unknown phase (`—`) rather than evaluating a phase outside its
  defined White-turn context.

The phase functions in individual mate rule sets remain White-turn-only. The
workspace display helper owns the turn-aware selection between a fresh phase
and the recorded phase.

## Verification

- Assert that White-to-move positions call the rule-set phase evaluator.
- Assert that Black-to-move positions use the latest White log phase without
  calling the evaluator.
- Assert that Black-to-move positions without a White log show `—`.
- Run the focused workspace-support tests, lint, build, and a diff check.
- Report unrelated pending Rook-policy test failures separately.
