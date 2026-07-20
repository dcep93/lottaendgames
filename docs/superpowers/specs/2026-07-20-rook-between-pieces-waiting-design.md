# Rook between-pieces waiting design

## Goal

Replace the Rook waiting priority and its implementation with this literal
rule:

> **waiting move** — If the kings are a knight's move apart, and the rook is
> not adjacent to White's king, move the rook, keeping the box, and with
> white's king between the other pieces.

## Geometry

The waiting priority activates only when:

- the current position has a Rook box;
- the kings are a knight's move apart; and
- the Rook does not start adjacent to White's King.

A candidate waiting move must be a quiet safe Rook move that preserves or
shrinks the current box and retains a strongest box boundary. After the move,
White's King must be strictly between the Rook and Black's King along the
Rook's movement axis. For a horizontal Rook move, compare files; for a vertical
Rook move, compare ranks. This definition is symmetric under all rotations and
reflections.

When the trigger is inactive, every candidate ties at the waiting priority.
There is no adjacent-Rook exception and no fallback to the former same-side
test. Earlier and later rendered priorities decide the move normally.

## Verification

- Pin the exact rendered sentence.
- Replace same-side and adjacent-start fixtures with direct between-pieces,
  trigger-inactive, box-preservation, and D4 symmetry checks.
- Record any approved fixture changes caused by removing the adjacent-Rook
  exception.
- Run the exhaustive identity-keyed Rook verifier and report one shortest
  directly replayable loop or 50-move witness if it fails.
- Run the Mate session tests, lint, and production build.
