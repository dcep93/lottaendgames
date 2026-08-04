# Two Bishops Remove Lazy King Design

## Goal

Replace the phase-split final king rules with one global, human-readable king rule.

## Rendered Rule

> **king closer** — Bring White's king closer to Black's king.

Remove `lazy king` from the visible priorities.

## Mechanics

- `king closer` applies in both phases.
- It retains the existing Manhattan-distance comparison.
- A surviving king move receives its post-move Manhattan distance to Black's king. A bishop move retains the non-king sentinel, so a legal surviving king move ranks ahead of a bishop move.
- Earlier priorities remain authoritative and may eliminate unsafe, stalemating, phase-breaking, or otherwise inferior moves before `king closer` runs.
- Remove `lazyKingPenalty`; no hidden replacement preference remains.

## Verification

- Update the exact visible rule list and rendered-copy assertion.
- Replace implementation-shaped Lazy King tests with semantic assertions that `king closer` applies in both phases and chooses the closest surviving king move.
- Preserve statelessness, D4 symmetry, and the existing universal and strategic regressions.
- Run focused Two Bishops rules, directly affected presentation tests, TypeScript, diagram consistency, diff hygiene, and the root-local fail-fast loop finder.

## Non-goals

- Do not change the Manhattan metric or any earlier priority.
- Do not add waiting behavior, history, lookahead, or a replacement selector.
- Do not run the full mate suite, browser loop validation, SCC census, commit, push, or deploy.
