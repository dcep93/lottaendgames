# Two Bishops Rule Y Diagonal-Distance Design

## Goal

Correct Rule Y so “as close as possible” measures the occupied adjacent diagonals relative to Black's king, not the bishops' squares relative to Black's king.

## Metric

- Represent each board diagonal by its sum or difference projection index.
- A bishop pair qualifies as adjacent in an orientation when its two projection indices differ by one.
- For each qualifying orientation, compute the sum of the absolute differences between the bishops' two diagonal indices and Black's king's index in that orientation.
- Use the smaller summed distance when both orientations qualify.
- Moving a bishop along the same diagonal does not change Rule Y's distance score.

## Priority

Rule Y continues to compare:

1. Do not check Black's king.
2. Occupy adjacent diagonals.
3. Minimize adjacent-diagonal distance from Black's king.

Existing later rules break any remaining ties. Rendered text and order remain unchanged.

## Regression

From `8/8/1B6/8/6K1/3B4/8/4k3 w - - 4 3`, `Be3`, `Bc5`, and `Bg1` keep the same adjacent diagonal pair and therefore tie within Rule Y even though the bishops occupy squares at different distances from Black's king.

## Verification

- Rename the Rule Y score field to reflect diagonal distance.
- Update supplied-position and symmetry tests.
- Run focused and full app checks.
- Find and open a fresh strict Phase 1 loop, treating Phase 2 as termination.
