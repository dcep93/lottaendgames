# Two Bishops r10/r12 Refinement

## Goal

Refine the minimal Two Bishops experiment without changing its rule order.

## Rule r10

Rule r10 remains the adjacent-diagonal wall rule. A qualifying wall must:

- place the bishops on adjacent parallel diagonals;
- put Black strictly on the corner side of both controlled diagonals;
- put White strictly on the opposite side, so the wall does not enclose White; and
- leave Black at least four parallel diagonals on the corner side.

Among qualifying walls, the score minimizes the number of board squares on Black's corner side. Because walls leaving fewer than four diagonals do not qualify, this selects a four-diagonal confinement whenever one is available and otherwise prefers progress toward it.

## Rule r12

Rule r12 continues to minimize the number of bishops on an edge. An edge bishop is exempt when it is exactly four king steps from r10's target corner. If r10 does not identify a target corner in the resulting position, no edge exception applies.

The priority guide displays this example:

`8/8/8/8/4K3/6k1/3B4/3B4 w - - 12 7`

Here r10 identifies `h1` as the target corner, so the bishop on `d1` is an allowed edge bishop because it is four king steps from `h1`.

## Implementation

Represent each qualifying r10 wall as a confinement profile containing its corner-side area, number of remaining diagonals, and target corner. Use the best profile for r10 scoring and its target corner for r12 scoring. Keep the existing exported area helper as a wrapper so callers do not depend on the profile representation.

## Verification

Focused tests cover the four-diagonal floor, smaller-area preference above that floor, the r12 edge exception, ordinary edge penalties, exact rule text, and the supplied diagram. After focused checks, run the early-exit exact cycle search and load the first UI-valid four-ply loop at cursor 0.
