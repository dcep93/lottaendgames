# Two Bishops Rule G Wall-Corner Design

## Goal

Rule G must derive its knight-target squares from the corner containing Black inside the resulting eligible bishop wall, rather than from Black's geometrically nearest board corner.

In `8/8/8/8/2B5/2K1B3/8/4k3 w - - 0 1`, the wall contains Black toward a1. Rule G therefore targets b3 and c2. Moves toward h1's knight squares f2 and g3 are geometrically irrelevant.

## Implementation

Evaluate Phase 2 and its tightest eligible walls after each candidate White move. Collect the wall corners, derive their knight-move squares, and score the resulting White king by minimum squared Euclidean distance to those targets.

## Verification

- Prove that b3 and c2 are the targets in the supplied position.
- Prove `Kd4` loses Rule G to a move reaching b3 or c2.
- Verify rotations and reflections.
- Run focused tests, build, lint, and diff checks.
- Find, independently validate, and load a new h1-oriented loop at `cursor=0`.
