# Mate Log Blue Background Emphasis

## Goal

Make the mate-log table's blue multiple-choice status cells visibly distinct while preserving the existing visual language.

## Design

- Keep the existing diagonal blue gradient and inset border.
- Increase the gradient from `rgba(88, 143, 199, 0.17)` → `0.08` to `0.34` → `0.18`.
- Increase the inset border from `rgba(126, 176, 224, 0.18)` to `0.42`.
- Do not alter layout, typography, semantics, hover behavior, the red wrong-answer state, or other table cells.

## Verification

- Update the focused stylesheet contract assertion.
- Run the mate-log presentation/style test, TypeScript, and `git diff --check`.
- Inspect the rendered table state at desktop and narrow viewport sizes.

## Scope

No unrelated styling, full mate suite, commit, archive synchronization, push, or deployment.
