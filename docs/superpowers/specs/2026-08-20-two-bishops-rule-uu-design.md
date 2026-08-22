# Two Bishops Rule UU Design

## Rule

Add immediately before `onsides` (and therefore before Rule U):

> **rule uu** — If the kings are a knight's move apart, flank if the swap reduces the moat's distance from the edge on Black's side by at least 2.

## Behavior

The starting kings must be a knight's move apart. A qualifying White king move must leave them a knight's move apart while swapping the moat axis between file and rank. Measure each moat from its midpoint line to the board edge on Black's side. Prefer exactly those swaps whose resulting distance is at least two squares smaller than the starting distance.

## Verification

From `8/8/8/8/1k6/4BB2/2K5/8 w - - 0 1`, `Kd3` swaps the rank moat for a file moat and reduces the Black-side edge distance from 5 to 2, so it is uniquely preferred by Rule UU. Verify rule ordering, rendered text, TypeScript, and a replayed local loop at `cursor=0`.

From `8/8/2K5/8/1k6/4B3/4B3/8 w - - 6 4`, `Kd5` reduces the distance from 4 to 2. Rule UU must evaluate before `onsides`, so bishop relocation cannot eliminate the qualifying king swap.

## Assumption

“Swap” changes the moat axis while retaining knight-step king geometry.
