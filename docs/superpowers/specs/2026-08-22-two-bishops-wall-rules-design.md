# Two Bishops Wall Rules N, O, and W

## Active order

White uses `mate`, `bishops safe`, `no stalemate`, `prepare mate`, `rule n`, `rule o`, `king closer`, then `rule w`.

## Bishop-wall geometry

A bishop wall consists of two bishop-controlled, adjacent squares that are each adjacent to Black's king. A candidate corner must lie on Black's side of the wall. Its corner-to-wall area is bounded by the board and the controlled diagonal closer to that corner.

White's king must remain outside that corner-to-wall area. It may screen the farther wall diagonal only when Black has no legal king move that exploits the screen and crosses the wall.

The implementation represents each wall explicitly: controlled adjacent squares, their controlling bishops and diagonals, escape square, target corner, nearer boundary diagonal, and geometric corner-area squares. Rotations and reflections use the same coordinate derivation rather than separate templates.

## Rule N

When an existing valid wall has its escape square controlled by White's king, prefer bishop moves that give check and shift the wall inward. The checking move must force every legal Black response to remain behind the tighter wall. Compare the tighter wall using the nearer diagonal's geometric position, not Black's response square.

## Rule O

After White moves, find valid wall areas of at least four squares. Prefer the smallest such area. If no candidate move produces a qualifying wall, Rule O is inactive.

## Rule W

After White moves, count bishops at least three Chebyshev king steps from Black's king. Prefer the larger count. Distances beyond the threshold do not break ties.

## Training information

Render this note: “A bishop wall is two adjacent diagonals both adjacent to Black's king, and White's king not in Black's king's corner-to-wall area.” Add one Rule N board showing a wall, White's king controlling the escape square, and the shrinking checking move. Keep all legacy notes and diagrams hidden.

## Verification

Test wall recognition, nearer-diagonal area calculation, the minimum-four bound, safe White-king screening, Rule N forced checking shrinkage, Rule W post-move threshold scoring, rotations/reflections, rendered help, and the active order. Then obtain and independently validate a production loop and load it at `cursor=0`.
