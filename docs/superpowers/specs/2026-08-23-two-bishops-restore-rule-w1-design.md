# Two Bishops Restore Rule W1 Design

## Goal

Restore Rule W1 to the active Two Bishops policy without changing its existing scorer, text, or Rule W3.

## Behavior

- Restore: **Phase 2: Prefer king proximity to the square a knight's move from Black's corner, unless it screens the inner bishop.**
- Reuse the existing Rule W1 applicability, screening penalty, and squared-distance penalty.
- Restore Rule W1 immediately before Rule W2.
- Keep Rule W3 immediately after Rule WZ and before Rule W.

## Verification

- Assert Rule W1 appears immediately before Rule W2 with its exact text.
- Restore the existing selection assertion showing Rule W1 chooses the corner-knight target.
- Run focused tests, build, lint, the development verifier, and load a validated cycle at `cursor=0`.
