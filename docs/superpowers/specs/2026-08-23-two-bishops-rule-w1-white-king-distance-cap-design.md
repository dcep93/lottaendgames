# Rule W1 White-King Distance Cap Design

## Goal

Revise Rule W1 to read:

> **rule w1** — Phase 2: Prefer king proximity to the square a knight's move from Black's corner, but no more than 2 steps from Black's king.

Rule W1 will no longer require Black's king to be within two moves of the wall corner. Instead, it will evaluate the position after White's candidate move and apply only when White's resulting king is no more than two king steps from Black's king.

## Behavior

- Keep the existing Phase 2 and tightest-wall requirements.
- Derive the target squares a knight's move from the applicable wall corner as before.
- Measure the White king after the candidate move.
- Keep Rule W1 applicable across the Phase 2 candidate group, but rank moves that leave the resulting White king within Chebyshev distance two of Black's king ahead of moves outside that cap.
- Among moves with the same cap status, prefer the smallest squared Euclidean distance from White's resulting king to a target square.
- Preserve existing screening diagnostics; this change only replaces the Black-to-corner distance gate.

## Tests

- Update the exact help-text assertion.
- Confirm Rule W1 can apply when Black is farther than two moves from the corner if White finishes within two moves of Black.
- Confirm a candidate leaving White more than two moves from Black does not satisfy Rule W1.
- Retain focused Phase 2, wall-geometry, and symmetry coverage.
- Generate a closed loop, validate every ideal move and reply independently, orient it so Black's closest corner is h1, and load it at `cursor=0`.
