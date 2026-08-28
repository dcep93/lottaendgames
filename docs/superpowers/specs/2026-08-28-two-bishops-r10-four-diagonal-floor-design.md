# Two Bishops r10 Four-Diagonal Floor

## Goal

Make r10 match its new literal rule text and allow White to occupy a controlled boundary.

## Rule r10

Rule text: "Prefer controlling adjacent diagonals not enclosing White, leaving Black at least 4 diagonals within its corner."

A bishop wall qualifies when:

- the bishops control adjacent parallel diagonals;
- Black is strictly inside the corner-side region beyond the nearer controlled diagonal;
- that corner-side region contains at least four parallel diagonals; and
- White is not strictly inside that region.

White may stand on either controlled diagonal because a boundary square is not enclosed. All qualifying walls tie under r10; the rule does not secretly minimize area or distance from four.

The regression position before `Be3` is `8/8/8/8/5K2/8/5Bk1/3B4 w - - 0 1`. After `Be3`, the h1-side region contains four diagonals, Black is inside it, and White is on the outer controlled boundary. `Be3` must be the unique recommended move.

## Rule r12

r12 remains unchanged. Its target corners are the corners associated with any qualifying r10 wall. An edge bishop exactly four king steps from one of those corners is exempt.

## Implementation

Replace ordinal-distance wall profiles with qualifying-wall target corners. Collapse r10 to one binary penalty and remove the obsolete distance score and helper.

## Verification

Focused tests cover both diagonal axes, the four-diagonal floor, White on a boundary, rejection when White is enclosed, the unique `Be3` regression, unchanged r12 behavior, and the six-rule order. Then run the exact early-exit search from UI-valid roots and load the first valid four-ply loop at cursor 0.
