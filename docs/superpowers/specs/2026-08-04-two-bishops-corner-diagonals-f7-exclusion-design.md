# Two Bishops Corner-Diagonals f7 Exclusion

## Goal

Tighten `degenerate — corner diagonals` so the bishop assigned to control the h5 reference square may not occupy the f7 reference square.

## Behavior

- Preserve the existing exact-position recognition and D4 symmetry.
- Preserve one bishop's clear control of f8.
- Require the other bishop to control h5.
- Reject a repair when that h5-controlling bishop occupies f7.
- Apply the same exclusion to the transformed f7 square under every rotation and reflection.
- Leave all other legal h5-controlling destinations unchanged.

## Presentation

Render:

> **degenerate — corner diagonals** — Preserve one bishop's control of f8. Ensure the other bishop controls h5 without occupying f7.

The selector and rendered instruction must express the same exclusion.

## Verification

- Add a focused regression showing an f7 repair is rejected.
- Check the rejection under all eight D4 transforms.
- Preserve the existing accepted corner-diagonals fixtures.
- Run the focused Two Bishops rule tests, diagram consistency check, targeted TypeScript, and `git diff --check`.
- Find one all-Phase 2 loop and navigate the Codex sidebar browser to its replay URL.

## Scope

No other Two Bishops rule, phase definition, target-corner calculation, verifier policy, or diagram geometry changes.
