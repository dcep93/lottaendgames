# Two Bishops Rule Y Design

## Goal

Add Rule Y immediately after Rule W:

> When the kings are more than two steps from each other, places the bishops on adjacent diagonals, as close as possible to, but not checking Black's king

## Interpretation

- “Steps” means king steps (Chebyshev distance).
- The rule applies when the starting kings are more than two king steps apart.
- Two bishops are on adjacent diagonals when their occupied diagonals have consecutive indices in either diagonal direction.
- Candidate positions first avoid checking Black's king, then prefer adjacent diagonals, then minimize the sum of both bishops' king-step distances to Black's king.
- Rule Y is followed by the existing `king closer`, `unscreen bishops`, `central pieces`, and `bishop distance` priorities.

## Supplied position

For `8/8/1B6/8/6K1/3B4/8/4k3 w - - 4 3`, Rule Y ties `Be3` and `Bg1` at summed bishop distance four. Existing downstream priorities select `Be3` because `central pieces` rejects the edge bishop on g1.

## Scope

- Add Rule Y score fields and ordered-rule registration after Rule W.
- Add exact order, help-text, applicability, scoring, supplied-position, and symmetry tests.
- No diagram is added.

## Verification

- Run focused and full app checks.
- Find and open a fresh strict Phase 1 loop, treating Phase 2 as termination.
