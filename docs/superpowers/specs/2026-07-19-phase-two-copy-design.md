# Phase 2 copy cleanup

## Goal

Keep Phase 2 notes focused on memorable chess guidance. Remove narration about when the app displays or applies the note.

## Scope

- Queen: retain the geometric definition of Phase 2 and remove the White-turn display sentence.
- Rook: retain that the Rook cuts between the kings and remove the White-turn display sentence.
- Two Bishops: retain the position definition and square explanation, but remove the White-turn applicability sentence.
- Update exact-copy tests to lock in the shorter text.

This is a copy-only change. Evaluator behavior, phase detection, and rendering conditions do not change.

## Copy rule

Rule help should explain what the player should recognize or do on the board. It should not describe UI visibility or internal turn gating unless that fact is necessary to execute the technique.

## Verification

Run the focused major-piece and Two Bishops rule tests, then lint the app.
