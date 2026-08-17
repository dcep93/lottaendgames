# Rule V Secondary Check Design

## Goal

Extend Rule V so a prepared primary squeeze diagonal leads to a check from its matching secondary squeeze diagonal.

## Behavior

Rule V remains Phase 1-only and is evaluated for both opposition squeeze geometries.

For each applicable geometry:

1. If the starting bishops already control its primary squeeze diagonal, prefer a bishop move that checks from its secondary squeeze diagonal while the primary remains controlled.
2. Otherwise, preserve the existing behavior: when a bishop can reach the secondary squeeze diagonal in one move, prefer resulting positions that control the primary squeeze diagonal.

If either opposition geometry starts with primary control, the prepared-check branch takes precedence over the setup branch.

The rendered English becomes:

> When the kings are in opposition and a bishop can control the secondary squeeze diagonal in one move, control the primary squeeze diagonal. If a bishop already controls the primary squeeze diagonal, check from the secondary squeeze diagonal.

The existing Rule V diagram continues to identify both primary and secondary diagonals, so its geometry does not change.

## Regression coverage

- In `B7/8/4K1k1/8/8/8/8/2B5 w - - 0 1`, `Be4+` is the unique ideal move under Rule V.
- The behavior remains invariant under every board rotation and reflection.
- Existing Rule V setup behavior and Phase 2 exclusion remain intact.
