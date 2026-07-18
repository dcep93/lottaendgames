# Rook Smallest-Box Selection

## Goal

Make the Rook `establish box` evaluator choose the closest legal cut that gives
Black the smallest resulting box. In the known loop position on White move 18,
this must reject `Rc4` in favor of `Rb1`.

## Scoring Change

Keep the existing ordered rule and its public ID, label, and help text unchanged.
The change is limited to `rookBoxSize` inside Rook White-move scoring.

When the starting position does not already have a closest rook-box axis and a
candidate move establishes one, calculate the resulting one-dimensional box
size along that actual established axis. Lower size remains better under the
existing `establish box` comparison. Candidates that do not establish a closest
axis retain the existing establishment penalty and do not need a meaningful box
size. Once a closest box already exists, this rule continues to leave later
box-preservation priorities in control.

For `8/8/8/3K4/8/k7/8/2R5 w - - 34 18`:

- `Rc4` establishes a rank cut with box size 3.
- `Rb1` establishes a file cut with box size 1.
- `Rb1` is the sole ideal White move, and `Rc4` is explained by `establish box`.

The evaluator rule order, Black response logic, and all user-facing tooltip and
guide copy remain unchanged.

## Verification

Add a focused regression test for the exact move-18 position, both candidate
scores, the sole ideal move, and the rejected move's explanation. Update any
existing score fixture whose box-size field becomes meaningful under the
corrected definition. Run Rook parity/self-play tests, the full Mate suite,
lint, and the production build.
