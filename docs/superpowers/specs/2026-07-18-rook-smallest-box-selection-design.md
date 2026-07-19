# Rook Smallest-Box Establishment and Preservation

## Goal

Make the Rook `establish box` evaluator choose the closest legal cut that gives
Black the smallest resulting box. In the known loop position on White move 18,
this must reject `Rc4` in favor of `Rb1`.

Once White has established a closest box, make its size monotonic: a candidate
may preserve or shrink that box, but may not expand or lose it merely to move
the rook farther from Black. In the minimal loop position after `1.Re7 Kf8`,
this must choose `Ra7` instead of `Re1`.

When more than one candidate establishes a closest cut, the smaller resulting
box must win regardless of whether that candidate changes axes. Preserve the
existing axis only as a tiebreak between equal-size boxes.

Fix the earlier perpendicular shuttle at its actual source: the king-approach
score currently rejects every king-rook rank or file alignment even when the
rook retains an active cut. Such an alignment is perpendicular to the
separating cut and does not block it, so it must not prevent a closer king move.

## Scoring Change

Keep the existing ordered rule and its public ID, label, and help text unchanged.
The change is limited to Rook White-move scoring and comparison.

When the starting position does not already have a closest rook-box axis and a
candidate move establishes one, calculate the resulting one-dimensional box
size along that actual established axis. Lower size remains better under the
existing `establish box` comparison. Candidates that do not establish a closest
axis retain the existing establishment penalty and do not need a meaningful box
size.

If the starting position has an established but non-closest cut, compare every
candidate that establishes a closest cut by resulting box size first. Lower is
always better. If sizes tie, prefer the candidate that retains the existing
axis. If there is no established cut, either axis remains eligible and the
smallest resulting box wins as before.

When the starting position already has a closest box, record its size and the
candidate's resulting closest-box size. The existing preservation penalty must
reject a candidate if it loses the closest box or makes it larger. Among the
remaining candidates, prefer the smaller resulting box before using rook
distance as the final tiebreak. An axis change remains valid when it preserves
or shrinks the box; the geometry, not the axis name, controls the result.

These checks remain within the final `maximize black distance` priority, after
all earlier safety, mating, and king-approach priorities. They therefore do not
force premature rook moves ahead of more important technique rules.

For `king closer`, retain the existing rank-or-file alignment penalty by
default. Waive it only for a White king move that strictly reduces actual
king-move distance (Chebyshev distance) to Black. Continue using the existing
Manhattan distance to rank ordinary king approach after that gate. This lets a
genuinely closer king move beat an unnecessary rook waiting move without making
every perpendicular alignment preferable.

`Kf3` in the shuttle root reduces king-move distance and receives the exception.
`Ke6` after `1.Re7 Kf8` only ties the existing king-move distance, retains the
alignment penalty, and therefore must not displace the approved `Ra7` rook move.

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

For `7K/2R5/8/k7/8/8/8/8 w - - 2 2`:

- `Rc6` retains the rank axis but creates a box of size 5.
- `Rb7` changes to the file axis and creates a box of size 1.
- `Rb7` is the sole ideal White move, and `Rc6` is rejected by `establish box`.

For the earlier cycle beginning at
`8/8/8/7k/5R2/4K3/8/8 w - - 0 1`, `Kf3` keeps the rank cut while bringing
White's king closer. It must not receive the broad king-rook alignment penalty,
and it must beat the unnecessary `Ra4`. If the later position after
`Ra4 Kg6` is evaluated independently, the smaller file box from `Rf4` correctly
beats the larger rank box from `Ra5`; play still cannot cycle because the
revisited starting position now continues with `Kf3`.

The evaluator rule order, Black response logic, and all user-facing tooltip and
guide copy remain unchanged.

## Verification

Add focused regression tests for both exact positions, the relevant candidate
scores, each sole ideal move, and each rejected move's explanation. Update any
existing score fixture whose box-size fields become meaningful under the
corrected definition. Add a regression for the perpendicular-cut cycle and its
king-approach continuation, plus the exact `Rb7` versus `Rc6` comparison. Assert
that the existing tooltip copy is unchanged. Run Rook parity/self-play tests,
the exhaustive Rook verifier, the full Mate suite, lint, and the production
build.
