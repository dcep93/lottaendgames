# Two Bishops `Kf2…Kh1` Phase 2 Branch

## Goal

Extend **play mate in 8** to cover the Phase 2 position reached when Black answers `Kf2` with `Kh1` instead of the existing canonical `Kh3` continuation.

## Behavior

From `8/8/8/6B1/8/8/5K2/3B3k w - - 2 2`, the rule accepts exactly:

- `Be2`, `Bf3`, and `Bh5` on the `d1–h5` diagonal.
- Legal bishop waiting moves on the `d8–h4` diagonal.

`Bg4` is not accepted. After a qualifying move and Black's `Kh2`, play rejoins the existing Phase 2 pattern at the `Bg4` stage. Rotations and reflections use the same transformed geometry.

## Implementation

The existing Phase 2 graph gains `Kh1` as a valid reply after the exact `Kf2` step. At the following White stage, candidate generation allows either waiting diagonal only for this branch. Downstream graph validation continues to prune moves that cannot rejoin the current mate pattern.

No rendered rule text or animation changes.

## Verification

- Assert the position remains Phase 2.
- Assert the production preferred-move set is exactly the requested seven moves.
- Assert every rotation and reflection preserves the branch.
- Reload the position in the app at `cursor=0` and verify the sidebar phase and rule output.
