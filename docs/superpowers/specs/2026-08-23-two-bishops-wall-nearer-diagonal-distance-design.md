# Two Bishops Wall Nearer-Diagonal Distance Design

## Goal

Make Rule O's three-diagonal threshold measure the wall diagonal nearer the relevant corner. In `8/8/8/8/5K2/8/8/4BBk1 w - - 0 1`, the undersized wall after `Bh3` must fail the threshold and `Be2` must be uniquely preferred.

## Design

`getTwoBishopsWalls` already orders each valid wall's controls as `nearer` and `farther`, but `cornerDiagonalDistance` currently stores `firstDistance`. When the first enumerated control becomes the farther control, the wall receives the wrong distance.

Store the distance belonging to the selected `nearer` control. This keeps the geometry object internally consistent: `cornerDiagonalDistance`, `nearerDiagonal`, and `areaSquares` all describe the same boundary. Rule O and Rule WW continue consuming the shared field without local workarounds.

## Verification

- Add a regression proving the `Bh3` wall is below the three-diagonal threshold while `Be2` qualifies.
- Assert `Be2` is the unique ideal move and is explained by Rule O.
- Run the focused two-bishops policy and wall-geometry tests, build, lint, and `git diff --check`.
- Find, verify move-by-move, and load a loop at `cursor=0`.

