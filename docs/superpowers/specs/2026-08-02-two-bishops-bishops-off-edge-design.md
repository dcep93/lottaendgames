# Two Bishops: Bishops Off Edge

## Goal

Replace the Phase 2 `force opposition` and `unmask` rules with one simpler, visible rule that prefers keeping White's bishops off the board edge.

## Policy

Insert `bishops off edge` immediately after `sequester`.

Rendered text:

> **bishops off edge** — Phase 2: Move White's bishops off the edge.

The rule applies only in Phase 2. For every surviving White move, count the White bishops whose destination positions are edge squares. Prefer the smaller count, so zero edge bishops beats one and one beats two. The rule adds no further tie-break.

Remove `force opposition` and `unmask` from the visible priorities and delete their policy-only score fields and comparisons. Do not change Degenerate repairs, Sequester, later rules, phase classification, or diagrams.

## Verification

Use focused Two Bishops tests to verify rule order, rendered copy, Phase 2 activation, exact edge-bishop counting, D4 symmetry, and removal of the old selectors. Run directly affected presentation checks, targeted TypeScript, and the existing fail-fast loop finder. Do not run the full mate suite.

## Constraints

- Current-position-only and D4 symmetric.
- Rendered wording and selector must match exactly.
- Preserve unrelated dirty work.
- No commit, push, deploy, or full mate suite.
