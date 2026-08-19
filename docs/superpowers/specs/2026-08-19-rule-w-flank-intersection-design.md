# Rule W Flank Intersection Design

## Goal

Reject purported two-diagonal Rule W flank diagonals that do not actually flank Black's king.

## Behavior

- Keep Rule W's eligible king geometries unchanged.
- For kings two diagonal steps apart, require every diagonal in a candidate pair to intersect both Black's file and Black's rank on the board.
- Keep the existing knight-step moat intersection rule unchanged.

In `8/8/7k/8/1B3K2/5B2/8/8 w - - 2 2`, `Be1` produces `f3-h5` and `e1-h4`. Those diagonals reach the h-file below `h6` but never reach the sixth rank, so Rule W must reject them.

## Verification

Add the supplied position as a focused regression, run the Rule W tests, and replace the invalid loop with a loop whose White and Black moves are both preferred and whose sidebar state is verified after navigation.
