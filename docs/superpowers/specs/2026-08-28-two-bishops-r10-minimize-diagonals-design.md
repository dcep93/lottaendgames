# Two Bishops r10 Minimize Remaining Diagonals

## Goal

Make r10 advance an already valid bishop wall toward its four-diagonal floor so `Bc2` is uniquely preferred in the demonstrated position.

## Rule r10

Rule text: "Prefer controlling adjacent diagonals not enclosing White, leaving Black as few diagonals as possible within its corner, but at least 4."

The existing qualification remains unchanged: adjacent parallel bishop diagonals, Black strictly inside the corner-side region, White not strictly inside it, and at least four corner-side diagonals remaining. Among qualifying result positions, minimize the number of remaining corner-side diagonals. Do not use geometric square area.

In `8/5K2/7k/8/8/1B6/1B6/8 w - - 0 1`, king moves preserve seven remaining diagonals. `Bc2` advances the wall to six while preserving the floor, so it must be uniquely recommended.

## Rule r12

r12 remains unchanged. When a result position has more than one qualifying r10 wall orientation, its target corners come only from the orientations tied for the fewest remaining diagonals.

## Implementation

Represent qualifying walls internally with their remaining diagonal count and target corner. Give r10 two ordered subpriorities: qualifying-wall penalty, then remaining diagonal count. Use the best-count target corners for r12.

## Verification

Focused tests cover the unique `Bc2` regression, the earlier unique `Be3` boundary regression, the four-diagonal floor, r12 target selection, exact rule text, and rule order. Then run the exact early-exit search from UI-valid roots and load the first valid four-ply loop at cursor 0.
