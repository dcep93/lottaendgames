# Remove Two Bishops `bishops away`

## Goal

Remove the `bishops away` priority so moves tied after `bishops off edge` cascade directly to `phase 2 wall`.

## Behavior

- Remove the visible `bishops away` rule and its cosine comparison.
- Remove the production score field and helper used only by that rule.
- Preserve `sequester`, `bishops off edge`, and `phase 2 wall` unchanged.
- In `8/8/8/4BB2/8/4K3/8/3k4 w - - 2 2`, make `Bb2` survive the earlier ties and win through `phase 2 wall`.
- Preserve current-board-only behavior and D4 symmetry.

## Presentation

The priority guide must no longer render `bishops away` or its cosine explanation. Rule numbering should close naturally around the removed priority.

## Verification

- Add or update a semantic regression for the supplied `Bb2` position.
- Remove tests that exist only to freeze the deleted cosine score.
- Run the focused Two Bishops rule tests, directly affected presentation tests, targeted TypeScript, diagram consistency, and `git diff --check`.
- Find one all-Phase 2 loop and navigate the Codex sidebar browser to its replay URL.

## Scope

No changes to other priorities, phases, target-corner scoring, degenerate patterns, Black policy, or verifier architecture.
