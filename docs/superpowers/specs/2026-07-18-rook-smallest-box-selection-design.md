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

When the starting position does not already have a closest rook-box axis,
calculate the resulting one-dimensional box size along every candidate's active
cut axis. Lower size remains better under the existing `establish box`
comparison. A candidate is penalized only if it establishes no active cut; the
closest-cut label must not make a larger box beat a smaller retained cut.

If the starting position has an established but non-closest cut, compare every
candidate with an active cut by resulting box size first. Lower is always
better. If sizes tie, prefer the candidate that retains the existing axis. If
there is no established cut, either axis remains eligible and the smallest
resulting active box wins as before.

When the starting position already has a closest box, record its size and the
candidate's resulting active-cut box size. The existing preservation penalty
must reject a candidate if it loses the active cut or makes its box larger. It
must not reject an axis change merely because the new cut is not the closest
possible cut: an equal or smaller active box is preserved. Among the remaining
candidates, grant shrink credit only when the resulting active cut is also a
closest cut. A non-closest equal-or-smaller cut ties the starting box size for
ranking; this lets it act as a waiting move without displacing a useful king
approach merely by claiming an off-center shrink. Then use rook distance as the
final tiebreak. The geometry, not the axis name, controls preservation.

Split the existing `maximize black distance` priority into two internal
evaluator stages with the same public ID, label, and help text. The first stage
runs immediately before `king closer` and compares only box preservation and
preserved box size. The second remains after `king closer` and compares only
rook distance from Black. The rule registry already deduplicates identical
public descriptions, so the guide and move explanations continue to expose one
unchanged `maximize black distance` priority in its existing visible position.

This ordering makes retaining the achieved box more important than walking the
king closer, while still preventing raw rook distance from overriding a useful
king approach. It also preserves the existing explanation ID for moves that
lose or enlarge the box.

For `king closer`, retain the existing rank-or-file alignment penalty by
default. Waive it only for a White king move that both strictly reduces actual
king-move distance (Chebyshev distance) to Black and preserves the rook's
existing cut axis. Continue using the existing Manhattan distance to rank
ordinary king approach after that gate. This lets a genuinely closer king move
beat an unnecessary rook waiting move without allowing the king to replace the
rook's established cut with a different one.

`Kf3` in the shuttle root reduces king-move distance and receives the exception.
`Ke6` after `1.Re7 Kf8` only ties the existing king-move distance, retains the
alignment penalty, and therefore must not displace the approved `Ra7` rook move.

For `1k6/8/2R5/2K5/8/8/8/8 w - - 0 1`, `Kd6` reduces king distance but changes
the rook's cut from the sixth rank to the c-file. It must retain the alignment
penalty. `Kd5` preserves the established rank cut, is the sole ideal White move,
and prevents the exact `Kd6 Ka7 Kc5 Kb8` cycle.

Add a second phase-two waiting pattern for the edge geometry in which the
starting cut is closest, its box size is 2, and the kings' file/rank deltas are
3 and 2. Require the rook to begin adjacent to White's king: this is the compact
position that needs a rook tempo. In that pattern, prefer a quiet rook move that
switches the active cut axis without enlarging the box. Rank qualifying moves by
Manhattan distance from Black so the rook waits as far away as possible. Once
the rook has moved far away, do not trigger the same axis-switch waiting pattern
again; resume king approach. Keep the existing knight-distance waiting pattern
and its distance ranking unchanged.

For `8/k7/2R5/3K4/8/8/8/8 w - - 0 1`, the rank cut and the file cut produced by
`Rc1` both have size 2. `Rc1` is therefore preservation, not box loss. It is the
farthest qualifying equal-box axis-switch waiting move and must be the sole
ideal move instead of `Kc5`. After `Rc1`, every legal Black reply must remain
provably mating under the evaluator.

After `1.Rc1 Kb8`, at `1k6/8/8/3K4/8/8/8/2R5 w - - 2 2`, the rook is no longer
adjacent to White's king. The edge-box waiting pattern must therefore be
inactive. `Kd6` is the sole ideal move through `king closer`; `Rc6` must not
switch the box axis back and recreate the four-ply cycle. Every legal Black
reply after `Kd6` must remain provably mating.

Add a compact straight-waiting pattern when the active box has size 2, the rook
is adjacent to White's king, and the kings' file/rank deltas are 3 and 1. Prefer
a quiet rook move that stays on the current cut line and preserves the active
box, then use the existing waiting-distance ranking. This is distinct from the
3-by-2 equal-box axis-switch pattern.

For `5k2/8/4R3/4K3/8/8/8/8 w - - 2 2`, `Ra6` retains the size-2 rank box while
`Kd5` creates a larger size-3 file box. Establishment must prefer `Ra6` over
`Kd5`, and the compact straight-waiting pattern must prefer it over `Kf5`.
`Ra6` is the sole ideal move. Every legal Black reply after `Ra6` must remain
provably mating.

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

For `7k/R7/4K3/8/8/8/8/8 w - - 6 4`:

- `Kf7` walks White's king closer but loses the established box.
- `Kf6` preserves the box at size 1.
- `Kf6` is the sole ideal White move, and `Kf7` is rejected by
  `maximize black distance` before `king closer` can prefer it.

For the earlier cycle beginning at
`8/8/8/7k/5R2/4K3/8/8 w - - 0 1`, `Kf3` keeps the rank cut while bringing
White's king closer. It must not receive the broad king-rook alignment penalty,
and it must beat the unnecessary `Ra4`. If the later position after
`Ra4 Kg6` is evaluated independently, the smaller file box from `Rf4` correctly
beats the larger rank box from `Ra5`; play still cannot cycle because the
revisited starting position now continues with `Kf3`.

Black response logic and all user-facing tooltip and guide copy remain
unchanged. The evaluator gains only the internal early preservation stage; its
deduplicated visible rule order remains unchanged.

## Verification

Add focused regression tests for both exact positions, the relevant candidate
scores, each sole ideal move, and each rejected move's explanation. Include the
exact `Kf6` versus `Kf7` preservation regression and assert that the duplicated
internal stage produces only one unchanged visible rule description. Update any
existing score fixture whose box-size fields become meaningful under the
corrected definition. Add a regression for the perpendicular-cut cycle and its
king-approach continuation, the exact `Rb7` versus `Rc6` comparison, and the
`Kd5` versus `Kd6` cut-axis comparison. Add the exact `Rc1` versus `Kc5`
edge-box waiting regression, including equal active-box sizes and an exhaustive
check of every legal reply after `Rc1`. Add the exact `Kd6` versus `Rc6`
post-waiting regression and exhaustively check every legal reply after `Kd6`.
Add the exact `Ra6` versus `Kd5` and `Kf5` regression, including active box
sizes, and exhaustively check every legal reply after `Ra6`. Assert that the
existing tooltip copy and visible order are unchanged. Run Rook parity/self-play
tests, the exhaustive Rook verifier, the full Mate suite, lint, and the
production build. If another literal loop remains, encode one minimal exact-
position witness as a replay URL with explicit moves for Undo/Redo.
