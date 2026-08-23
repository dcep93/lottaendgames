# Rule O Occupied Wall Square Design

## Goal

Recognize `Bg5+` as maintaining the bishop wall and make it uniquely correct without penalizing the subsequent `Bh6` return.

## Geometry Fix

A bishop occupying a candidate wall square controls both diagonals through that square. Wall discovery must therefore evaluate both its sum and difference diagonals instead of rejecting the zero-length bishop-to-square relation.

## Tie-break

Rule O continues to minimize Black's corner area first. Among moves producing the same minimum area, prefer a move made by a bishop that controlled the farther, outer diagonal of a wall in the starting position. Do not prefer off-edge destinations globally.

In the reported line:

- `Bg5+` moves the outer-wall bishop from `h6` while retaining the same wall area, so it beats king moves and inner-bishop waiting moves.
- After `...Kh3`, `Bh6` also moves that outer-wall bishop and remains preferred.
- `Bg4+` moves the inner-wall bishop, so it does not displace `Bh6`.

No new rendered Rule WW is added.

## Verification

- Recognize a wall when either bishop occupies its wall square.
- Make `Bg5+` uniquely ideal in the starting position.
- Keep `Bh6` uniquely ideal after `Bg5+ Kh3`.
- Verify every rotation and reflection.
- Run focused Two Bishops tests, diagram drift, build, and the fast loop verifier.
