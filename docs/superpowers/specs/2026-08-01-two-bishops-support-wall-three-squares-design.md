# Two Bishops Support Wall at Three Squares

## Goal

Extend the existing `support wall` priority so it applies when an adjacent bishop wall is either two or three squares from Black's king.

## Design

- Keep one visible `support wall` rule; do not add another priority.
- Determine the source-position activation from current board geometry only.
- Activate when the two bishops are adjacent and either bishop has Chebyshev distance two or three from Black's king.
- Preserve the existing comparison: prefer a White king move that gets closer to Black's king or closer to the wall-opposition moat rank/file.
- Render exactly: “When the bishop wall is two or three squares from Black's king, bring White's king closer to Black's king, or the wall opposition moat rank/file.”

## Verification

- Preserve the existing two-square semantic regressions.
- Add a three-square position proving `support wall` activates and accepts only moves satisfying the existing king-improvement geometry.
- Run the focused Two Bishops rule tests, relevant presentation assertion, TypeScript, and `git diff --check`.
- Recheck a local Phase 1 loop after the change.

## Scope

No history, lookahead, cache, phase, Black-policy, or unrelated rule changes. No commit, push, deployment, full mate suite, or exhaustive loop census.
