# Two Bishops King Closer Phase 2 Line Design

## Goal

Teach White's king to occupy the support rank or file two squares inward from Black's edge during Phase 2.

## Rendered Rule

> **king closer** — Bring White's king closer to Black's king. If in phase 2, prefer the rank/file 2 away from Black's edge.

## Mechanics

- Keep `king closer` active in both phases.
- In Phase 2, identify every board edge currently occupied by Black's king.
- A surviving White king move satisfies the Phase 2 preference when its destination lies exactly two files or ranks inward from any occupied Black edge.
- Compare this exact-line preference before post-move Manhattan distance to Black's king.
- If no surviving move reaches an exact line, all moves tie on the Phase 2 preference and Manhattan distance remains the fallback.
- If Black is not currently on an edge, the Phase 2 preference is neutral.
- Bishop moves never satisfy the exact-line preference and retain the existing non-king Manhattan sentinel.
- The mechanic is current-position-only and D4 symmetric.

For `6k1/8/5BB1/5K2/8/8/8/8 w - - 0 1`, Black occupies rank 8, so rank 6 is preferred. `Ke6` is the only surviving king move on that rank and must be uniquely recommended even though `Kg5` has a smaller Manhattan distance.

## Verification

- Assert `Ke6` uniquely wins the supplied position because the line preference outranks Manhattan distance.
- Assert the Phase 1 Manhattan regression is unchanged.
- Assert exact-line behavior under all D4 transforms and at a corner with either occupied edge.
- Assert fallback behavior when no exact-line move survives and when Phase 2 starts before Black reaches an edge.
- Update exact score-shape and rendered-copy assertions.
- Run focused Two Bishops rules, directly affected presentation checks, TypeScript, diagram consistency, diff hygiene, and the root-local fail-fast loop finder.

## Non-goals

Do not use a continuous distance-to-line score, lookahead, history, or a hidden selector. Do not change Phase 2 classification, earlier priorities, Black policy, or other patterns. Do not run the full mate suite, browser validation, SCC census, commit, push, or deploy.
