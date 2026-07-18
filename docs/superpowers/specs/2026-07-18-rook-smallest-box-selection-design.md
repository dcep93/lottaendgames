# Rook Smallest-Box Establishment and Preservation

## Goal

Make the Rook `establish box` evaluator choose the closest legal cut that gives
Black the smallest resulting box. In the known loop position on White move 18,
this must reject `Rc4` in favor of `Rb1`.

Once White has established a closest box, make its size monotonic: a candidate
may preserve or shrink that box, but may not expand or lose it merely to move
the rook farther from Black. In the minimal loop position after `1.Re7 Kf8`,
this must choose `Ra7` instead of `Re1`.

When Black steps away from a closest cut but the rook still maintains an
established cut, advance that cut on its existing axis before switching axes.
This prevents the evaluator from shuttling between perpendicular cuts as Black
steps between two squares.

## Scoring Change

Keep the existing ordered rule and its public ID, label, and help text unchanged.
The change is limited to Rook White-move scoring and comparison.

When the starting position does not already have a closest rook-box axis and a
candidate move establishes one, calculate the resulting one-dimensional box
size along that actual established axis. Lower size remains better under the
existing `establish box` comparison. Candidates that do not establish a closest
axis retain the existing establishment penalty and do not need a meaningful box
size.

If the starting position has an established but non-closest cut, candidates
that make that same axis closest survive before candidates that switch to the
perpendicular axis. Resulting box size breaks ties only after this axis-
continuity preference. If there is no established cut, either axis remains
eligible and the smallest resulting box wins as before.

When the starting position already has a closest box, record its size and the
candidate's resulting closest-box size. The existing preservation penalty must
reject a candidate if it loses the closest box or makes it larger. Among the
remaining candidates, prefer the smaller resulting box before using rook
distance as the final tiebreak. An axis change remains valid when it preserves
or shrinks the box; the geometry, not the axis name, controls the result.

These checks remain within the final `maximize black distance` priority, after
all earlier safety, mating, and king-approach priorities. They therefore do not
force premature rook moves ahead of more important technique rules.

For `8/8/8/3K4/8/k7/8/2R5 w - - 34 18`:

- `Rc4` establishes a rank cut with box size 3.
- `Rb1` establishes a file cut with box size 1.
- `Rb1` is the sole ideal White move, and `Rc4` is explained by `establish box`.

For `5k2/4R3/3K4/8/8/8/8/8 w - - 2 2`:

- `Re1` changes to a file cut and expands Black's box from size 1 to size 3.
- `Ra7` and `Rb7` preserve the rank cut and its size 1.
- `Ra7` is preferred to `Rb7` by the existing rook-distance tiebreak.
- `Ra7` is the sole ideal White move, and `Re1` is rejected by
  `maximize black distance`.

For the cycle beginning at `8/8/8/7k/5R2/4K3/8/8 w - - 0 1`, Black's
`...Kg6` leaves White's rook with an established but non-closest rank cut.
White must advance that rank cut with `Ra5` instead of switching to the file cut
with `Rf4`; this breaks the `Ra4 Kg6 Rf4 Kh5` cycle.

The evaluator rule order, Black response logic, and all user-facing tooltip and
guide copy remain unchanged.

## Verification

Add focused regression tests for both exact positions, the relevant candidate
scores, each sole ideal move, and each rejected move's explanation. Update any
existing score fixture whose box-size fields become meaningful under the
corrected definition. Add a regression for the perpendicular-cut cycle and its
same-axis continuation. Assert that the existing tooltip copy is unchanged. Run
Rook parity/self-play tests, the exhaustive Rook verifier, the full Mate suite,
lint, and the production build.
