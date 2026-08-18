# Two Bishops Rule W Tie-Break Design

## Goal

Allow lower-priority rules to break ties between moves that both satisfy Rule W.

## Behavior

- Remove Rule W's `stopWhenBest` behavior.
- Preserve Rule W's applicability, penalty calculation, urgent-flank partial credit, label, and rendered help text.
- Continue tied Rule W candidates through `king closer`, `unscreen bishops`, `central pieces`, and `bishop distance` in their existing order.

## Regression

For `8/6k1/4K3/1BB5/8/8/8/8 w - - 2 2`, both `Bc6` and `Bd7` satisfy Rule W, but `Bc6` must win because it leaves no bishop screened by White's king while `Bd7` leaves one.

## Verification

- Add a focused regression for the supplied position.
- Preserve all Rule W geometry, symmetry, and partial-credit tests.
- Run focused and full app checks.
- Find and open a fresh strict Phase 1 loop, treating Phase 2 as termination.
