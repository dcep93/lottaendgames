# Two Bishops Target Corner by Edge-Control Distance

## Goal

Choose `a1` as the target corner in `8/8/8/8/8/4KB2/7B/4k3 w - - 2 2` while preserving the earlier `b8/c8` edge-control example's `h8` target.

## Design

For a non-corner Black king on an edge:

1. Enumerate every square on that edge currently controlled by either bishop through a clear diagonal.
2. For each corner on the same edge, sum its along-edge distance from every controlled square.
3. Choose the corner with the larger sum: the corner farther from the bishops' edge control.
4. If the sums tie, or no edge square is controlled, choose the corner on Black's edge closest to White's king.

If Black is already in a corner, retain that occupied corner. The target is calculated once from the current board and reused for every candidate move. The rule remains stateless and D4-symmetric.

In the supplied position, the controlled squares are `d1`, `g1`, and `h1`. Their total distances are 16 from `a1` and 5 from `h1`, so the target is `a1`.

## Verification

- Assert the supplied position's recommendations reflect target `a1` and do so under every D4 transform.
- Preserve the earlier `b8/c8` to `h8` regression.
- Run focused Two Bishops, affected presentation, TypeScript, diagrams, and diff checks.
- Find and report the next all-Phase-2 fail-fast loop without browser validation.
