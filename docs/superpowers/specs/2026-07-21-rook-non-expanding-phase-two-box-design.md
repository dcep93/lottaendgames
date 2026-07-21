# Rook Non-Expanding Phase-Two Box Design

## Goal

Make `establish box` require a phase-two box without rewarding needless
shrinkage of an existing phase-two box.

## Visible rule

Display:

> **establish box** — Use the Rook to make a phase 2 box.

## Evaluator behavior

`establish box` is a binary gate rather than a box-size minimizer.

- If the current position is not phase 2, a move passes when its result is
  phase 2.
- If the current position is phase 2, a move passes when its result remains
  phase 2 and its resulting Rook box is no larger than the current Rook box.
- Preserving and shrinking the current box tie at this priority. Later visible
  rules decide between them.
- Leaving phase 2 or enlarging an existing phase-two box fails this priority.

The computed box size may remain in the diagnostic score, but `establish box`
must no longer compare candidate sizes directly.

## Required example

From `8/2K5/R7/4k3/8/8/8/8 w - - 6 4`, the current phase-two box has size 5.
Both `Rd6` (size 4) and `Kd7` (size 5) pass `establish box`. The later
`king closer` rule selects `Kd7`.

## Verification

- Pin the exact visible copy.
- Assert that preserving and shrinking a phase-two box tie at `establish box`.
- Assert that enlarging a current phase-two box fails.
- Assert that the required position selects `Kd7` and explains `Rd6` with the
  later differing priority rather than `establish box`.
- Update affected literal and symmetry fixtures to follow the new ordered
  rules.
- Run focused Rook tests, the exhaustive identity-keyed Rook verifier, the
  complete mate suite, lint, build, and a diff check.
