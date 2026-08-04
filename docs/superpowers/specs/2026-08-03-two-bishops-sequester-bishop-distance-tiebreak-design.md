# Two Bishops Sequester Bishop-Distance Tiebreak Design

## Goal

Extend the visible sequester rule with a final, general preference among otherwise tied bishop moves.

## Rendered rule

> **sequester** — Phase 2: Force Black's king towards the target corner, or otherwise use a bishop to control the square 2 away from Black's current square. When deciding between bishop moves, prefer larger distance from the target corner.

## Mechanics

Sequester compares candidates in this order:

1. Minimize Black's worst legal-reply Manhattan distance to the fixed target corner.
2. If the best distance does not improve on Black's current distance, prefer bishop control of either on-board edge square exactly two steps from Black's current square. Skip this fallback after genuine corner progress.
3. When the two candidates are both bishop moves and remain tied, maximize the sum of both resulting bishops' squared Euclidean distances from the target corner.

The third comparison is neutral if either candidate is a king move. Later visible rules may then decide. The policy uses only the current board and candidate result, remains D4-symmetric, and has no history or lookup dependency.

## Verification

- Add a direct bishop-only tiebreak fixture and every D4 transform.
- Preserve the approved `Bd2` control of `a5` and `Kf2 ... Kh1` fallback suppression.
- Run focused Two Bishops rules, affected presentation, TypeScript, diagrams, and diff checks.
- Run the fail-fast development search and report one refreshable localhost loop without browser validation.
