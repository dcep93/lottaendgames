# Rook adjacency-agnostic waiting rule

## Goal

Remove the restriction that disables `waiting move` when the Rook begins
adjacent to White's King. The human-facing rule and evaluator must say and do
the same thing.

## Rule

Display:

> **waiting move** — If the kings are a knight's move apart, move the rook,
> keeping the box, and with white's king between the other pieces.

When an existing Rook box exists and the kings are a knight's move apart, the
waiting priority activates regardless of whether the Rook begins adjacent to
White's King.

The existing candidate requirements remain unchanged: a waiting move must be a
quiet, safe Rook move; preserve or shrink the box; retain a strongest boundary;
and leave White's King strictly between the Rook and Black's King on the Rook's
movement axis. Later visible priorities continue to resolve any remaining tie.

## Verification

- Assert the displayed rule text exactly matches the new sentence.
- Replace tests that treat initial Rook adjacency as a trigger exception with
  tests proving adjacency does not disable waiting.
- Update deterministic fixtures only where the literal general rule changes
  the selected move.
- Run the Rook rule tests and exact identity-keyed Rook verifier, then run the
  session/presentation tests, lint, and production build.
- If exhaustive verification still finds a cycle or 50-move draw, report one
  shortest replay from its minimal cycle or draw boundary.
