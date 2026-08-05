# Two Bishops Cross-Move Target-Corner Score

## Goal

Make `sequester` prefer candidate White moves whose resulting position has the stronger target-corner score.

## Behavior

- Continue calculating target corners after each candidate White move in Phase 2.
- Continue scoring each edge corner by the number of bishops beyond White's king toward the opposite corner along Black's edge.
- Record the winning score for each candidate result.
- Compare candidates by target-corner score before comparing forced progress toward the selected corner.
- Break any remaining tie with the existing forced-progress comparison, then the existing two-away-control comparison.
- Retain tied target corners within one candidate when their score and White-king distance remain tied.
- Preserve current-board-only behavior and D4 symmetry.

For `4k3/7B/4KB2/8/8/8/8/8 w - - 0 1`, `Bb1` produces target h8 with score 1 while `Bg7` produces target a8 with score 2, so `Bg7` must be uniquely recommended.

This global preference also supersedes the former `Bb2` result in `8/8/8/4BB2/8/4K3/8/3k4 w - - 2 2`: `Bg3` scores 2 while `Bb2` scores 1, so `Bg3` becomes uniquely recommended even though `Bb2` has the better later `phase 2 wall` score.

## Presentation

Extend the target-corner note to say that White prefers moves with the higher target-corner score. Keep `sequester` as the visible rule that owns the comparison.

## Verification

- Add a D4 regression proving `Bg7` is unique in the supplied position.
- Assert the score difference between `Bg7` and `Bb1`.
- Preserve existing target-corner, Phase 2, statelessness, and symmetry tests.
- Run focused Two Bishops tests, affected presentation tests, targeted TypeScript, diagram consistency, and `git diff --check`.
- Find one all-Phase 2 loop and navigate the Codex sidebar browser to its replay URL.

## Scope

No changes to phase classification, Black policy, target-corner geometry, degenerate patterns, wall geometry, or verifier architecture.
