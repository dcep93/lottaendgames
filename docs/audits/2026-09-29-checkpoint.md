# Bishop-and-knight checkpoint — 2026-09-29

User-requested checkpoint of the current rule implementation, tests, training UI, diagrams, and audit tooling. This is an iteration checkpoint, not a clean-regression release.

The current r2 implementation contains only declarations made after its reset. Its cage-entry margin compares White's king-step distance to d4 with Black's distance to the closed neighborhood of h6, in the applicable D4 frame. The earlier accumulated r2 lines remain removed; earlier dated audit notes describe historical states.

## Latest complete reachable audit

From all winning satisfied-r4 starts, following every preferred White tie and legal Black reply, with D4 deduplication and only paths through tablebase-winning positions:

- 41 White-to-move seed orbits; each can reach a cycle.
- 140,957 reachable winning White-to-move positions.
- 17,987 distinct four-ply loops: 16,835 king shuffles, 1,086 bishop shuffles, 66 knight shuffles.
- 168,789 positions on cycles of any length, including side to move: 114,779 White, 54,010 Black.
- 107,175 cycle positions occur on no four-ply loop and therefore require a longer cycle. This does not count distinct longer cycles.
- Largest four-ply cohort: 14,292 king shuffles where the knight is never king-defended; 9,209 of these keep White's king off the edge throughout.

Clocks are reset for WDL eligibility and ignored for cycle identity. Complete local artifacts remain in `../_codex_output/bn-r2-entry-margin-complete-2026-09-29/`; large generated graphs and scratch tools in `.audit/` are not included in this commit.

## Checkpoint validation

- `tsc -b --pretty false`: passed.
- `git diff --cached --check`: passed before commit.
- `tsx --test src/mate/rules/bishopKnight*.test.ts src/mate/presentation.test.tsx`: 283 tests, 219 passed, 64 failed. Behavior and test expectations were preserved as requested; failures were not reconciled in this checkpoint. Local output: `.audit/checkpoint-tests.log`.
