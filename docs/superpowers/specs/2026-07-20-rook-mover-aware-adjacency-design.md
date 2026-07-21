# Rook mover-aware adjacency design

## Goal

Make the establish-box evaluator match the directional wording:

> **establish box** — Use the Rook to make the smallest phase 2 box without
> placing the rook adjacent to the White king.

Select `Kd5` from `8/8/k7/2R5/4K3/8/8/8 w - - 2 2`.

## Rule

The adjacency restriction applies only when the candidate move is a Rook move.
A Rook move that finishes adjacent to White's King fails `establish box`. A
King move may finish adjacent to the stationary Rook; it has not placed the
Rook anywhere.

All candidates must still result in phase 2. Eligible candidates continue to
compare box size. In the supplied position, `Kd5` and `Kd3` both preserve the
size-2 box and tie through `establish box`. The later `king closer` priority
selects `Kd5` because its row-plus-file distance to Black is smaller.

## Verification

- Pin `Kd5` as the unique best move with reason `king closer`.
- Assert that `Kd5` passes establish box while an adjacent Rook move fails it.
- Cover rotations and reflections.
- Run the exhaustive identity-keyed Rook verifier and report one minimal replay
  if it still fails.
- Run session tests, lint, and the production build.
