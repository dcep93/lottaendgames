# Rule W Activation and Unscreen Bishops Design

## Goal

Make Rule W preserve an already-complete pair of flank diagonals instead of acting as a setup rule. Add a final Two Bishops priority that prefers bishops not aligned diagonally with White's king.

## Rule W

Rule W remains Phase 1-only through its existing flank-geometry calculation. It applies only when the starting position has both flank diagonals controlled by the bishops for at least one applicable diagonal pair.

When active, its existing result score continues to prefer moves that preserve control of both diagonals. Its rendered text and diagram remain unchanged.

## Unscreen Bishops

Add this ordered priority immediately after `king closer`:

> **unscreen bishops** — Keep bishops off White's king's diagonal.

For each candidate move, calculate White's resulting king square and bishop squares. Count bishops whose file distance from White's king equals their rank distance from White's king. Prefer fewer such bishops.

This is a global Two Bishops priority and therefore applies in both phases. It is a tie-break after `king closer`; it does not override any earlier priority.

## Testing

- Rule W does not apply when the kings have Rule W geometry but the starting bishops do not control both flank diagonals.
- Rule W applies when the starting bishops control both diagonals and prefers preserving them.
- `unscreen bishops` appears after `king closer` with the exact rendered text.
- `unscreen bishops` prefers fewer bishops sharing a diagonal with White's resulting king.
- The score is invariant under all board rotations and reflections.
- Existing diagrams and phase behavior remain intact.

