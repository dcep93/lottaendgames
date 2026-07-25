# Phase 2 copy cleanup

## Goal

Keep Phase 2 notes focused on memorable chess guidance. Remove narration about when the app displays or applies the note.

## Scope

- Queen: remove the Phase 2 note entirely. Its visible strategy rules already
  explain the useful queen geometry without naming an additional phase.
  Because Queen then has neither notes nor diagrams, omit its empty Notes
  section from the modal.
- Rook: retain that the Rook cuts between the kings and remove the White-turn display sentence.
- Two Bishops: retain the position definition and square explanation, but remove the White-turn applicability sentence.
- Update exact-copy tests to lock in the shorter text.

This is a copy-only change. Evaluator behavior, phase detection, shared board
badges, log values, and rendering conditions do not change.

## Copy rule

Rule help should explain what the player should recognize or do on the board. It should not describe UI visibility or internal turn gating unless that fact is necessary to execute the technique.

## Verification

Run the focused major-piece and Two Bishops rule tests, then lint the app.
