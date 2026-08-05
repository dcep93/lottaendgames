# Two Bishops Corner-Diagonals Continuation Design

## Problem

In `8/3B4/8/8/8/2K3B1/8/1k6 w - - 2 2`, the policy calls `a8` the target and accepts `Bg4`. That move allows `...Kc1`, moving Black farther from the intended target corner `a1`.

This is the immediate continuation of the existing corner-diagonals geometry. Before Black stepped around the corner, the bishop cutoff on `a4` identified `a1` as the target. Black's move from the `a`-file to the first rank must not erase that board-derived orientation.

## Design

Extend the existing exact D4-symmetric corner-diagonals target family by one geometric continuation:

1. The existing form has White's king on the canonical `f6`, Black's king on `h7`, and distinct bishops controlling `f8` and `h5`. Its target is `h8`.
2. The continuation keeps White's king on `f6`, places Black's king on `g8`, and keeps a bishop cutoff on `h5`. Its target is still `h8`.
3. Apply all eight D4 transforms, but do not add translations.
4. Continue using raw worst Black-reply distance only inside this visible corner-diagonals target family.

In the supplied orientation, these canonical squares transform to White `c3`, Black `b1`, cutoff `a4`, and target `a1`. `Bf4` is uniquely preferred because every Black reply remains at most one edge step from `a1`; `Bg4` permits `Kc1`, two steps away. After `...Ka2`, the existing continuation chooses `Bd6`, which prevents `...Ka3`.

## Teaching Alignment

Update the corner-diagonals caption and target-corner note to say that the cutoff continues to define the target when Black steps around the corner. No new visible priority is added.

## Rejected Alternatives

- A global raw-distance tie-break changes unrelated sequester positions.
- A FEN-specific degenerate repair is not a reusable chess concept.
- The corner-diagonals continuation is the smallest general rule matching the visible geometry.

## Verification

- `Bf4` is uniquely correct and `Bg4` is rejected in the supplied position.
- After `Bf4 Ka2`, `Bd6` remains uniquely correct.
- Both behaviors hold under every D4 transform.
- Existing corner-diagonals, wall, opposition, king-race, and earlier `Bd2` fixtures remain intact.
- Focused Two Bishops, affected presentation, TypeScript, diagram, and diff checks pass.
- The next fail-fast cycle contains only Phase 2 positions and is loaded in the sidebar browser.
