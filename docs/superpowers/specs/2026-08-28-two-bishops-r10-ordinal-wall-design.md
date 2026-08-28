# Two Bishops r10 Ordinal Wall

## Goal

Replace area-based r10 scoring with a direct diagonal-ordinal target and remove rule r12 completely.

## Rule r10

A qualifying wall places the two bishops on adjacent parallel diagonals. Black must be strictly on the corner side of both diagonals, and White must be strictly beyond the opposite diagonal, so the wall encloses Black without enclosing White.

For each qualifying orientation, number parallel diagonals starting at Black's corner: the corner diagonal is first, the next is second, and so on. Because the bishops control adjacent diagonals, score the pair by its distance from the fourth and fifth diagonals. An exact fourth/fifth wall scores zero; a third/fourth or fifth/sixth wall scores one. Choose the smallest score across qualifying orientations.

This ordinal score is preferred over geometric area because the requested target is expressed in diagonal numbers. It is preferred over an exact-only filter because it guides moves toward the target when the fourth/fifth pair is not immediately reachable.

## Rule removal

Delete r12 from the score type, ordered rule list, help text, tests, and priority-guide diagrams. The remaining experiment order is: mate, bishop safety, no stalemate, r10, then r15.

## Verification

Focused tests cover both diagonal axes, Black/White side qualification, exact fourth/fifth scoring, symmetric one-step deviations, rule order, and the absence of the r12 diagram. After the focused checks, run the exact early-exit cycle search from UI-valid roots and load the first valid four-ply loop at cursor 0.
