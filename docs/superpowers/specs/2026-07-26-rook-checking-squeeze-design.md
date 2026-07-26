# Rook Checking Squeeze Design

## Goal

Recognize the central Rook-mate squeeze: when the kings are in opposition, a
rook check can force Black behind a new, smaller wall.

## Behavior

A checking rook move counts as keeping and shrinking the box when:

- a box already exists;
- the rook remains safe;
- Black has at least one legal reply; and
- every legal Black reply produces a box strictly smaller than the current box.

The guaranteed resulting box size is the largest box Black can choose among its
legal replies. That worst-case size is used when comparing checking squeezes.

For `8/5k2/R7/5K2/8/8/8/8 w - - 2 2`, `Ra7+` forces `Ke8`, `Kf8`, or `Kg8`.
Every reply leaves a size-1 box, so `Ra7+` outranks `Rb6`, which merely keeps
the size-2 box.

## Mechanical Alignment

This behavior belongs to the existing `rook box` rule. It uses only the current
position and legal replies. It does not use move history, a tablebase, a move
counter, or a concealed selector.

## Verification

- Add a regression test proving `Ra7+` is the unique recommended move.
- Assert that all three Black replies produce size-1 boxes.
- Run the focused Rook rule and geometry tests.
- Run one low-priority exhaustive Rook verifier and report the next loop, if
  any, without automatically changing another rule.
