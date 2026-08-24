# Two Bishops Rule W Phase 1 Design

## Goal

Restrict Rule W to Phase 1 while preserving its existing post-move bishop-distance comparison.

## Behavior

- Render Rule W as: **Phase 1: Prefer bishops 3 or more steps from Black's king.**
- Determine Rule W applicability from the position after White's candidate move.
- Apply Rule W when that resulting position is Phase 1 and both kings remain available for normal scoring.
- Do not apply Rule W when the resulting position is Phase 2, including a move that enters Phase 2 from Phase 1.
- Keep the existing penalty: each bishop fewer than three king-steps from Black contributes one penalty point.

## Ordering

Rule W remains after Rule WZ. No other priority changes.

## Verification

- Assert the exact help text.
- Assert Rule W applies to a candidate whose resulting position remains Phase 1.
- Assert Rule W does not apply to candidates whose resulting position is Phase 2, whether Phase 2 existed before the move or was established by the move.
- Run the focused Two Bishops tests, build, lint, development verifier, and load a validated cycle at `cursor=0`.
