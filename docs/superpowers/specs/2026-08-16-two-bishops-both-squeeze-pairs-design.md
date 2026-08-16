# Two Bishops: Both Squeeze-Diagonal Pairs

## Goal

When the kings are in direct opposition, evaluate both possible primary/secondary squeeze-diagonal pairs instead of selecting only the pair facing the board center.

## Geometry

Direct opposition supplies the forward axis from White's king toward Black's king. Each of the two perpendicular unit vectors supplies one squeeze orientation. Combining the forward axis with each perpendicular vector produces two diagonal normals.

For each normal, retain the existing offsets from White's king: the secondary diagonal is projection plus two and the primary diagonal is projection plus three. The primary and secondary diagonals remain a pair; eligibility from opposite orientations must never be mixed.

## Rule V

For each of the two pairs, independently determine whether a bishop can reach its secondary diagonal in one legal move. Rule V applies when at least one pair is eligible. A candidate satisfies Rule V when a resulting bishop occupies the primary diagonal belonging to any eligible pair.

In `8/8/8/8/1k1K1B2/3B4/8/8 w - - 44 23`, the center-facing pair offers only unsafe `Bb5`. The opposite pair makes `Bc2` a safe Rule V move, so Rule V—not king closer—owns that recommendation.

## Rule S

For every legal White king move that creates direct opposition, derive both prospective squeeze pairs from the resulting kings. Evaluate the existing post-king-move, distinct-bishop preparation independently for each pair. The opposition move qualifies when either complete pair satisfies Rule S.

## Diagram

Update the existing Rule V note board to highlight both primary diagonals with the primary style and both secondary diagonals with the secondary style. Change the caption to plural. Keep the existing example arrow as one illustrated primary move.

## Verification

Test the supplied `Bc2` case, both pair orientations, pair isolation, Rules S and V under all D4 transforms, Phase 2 inactivity, priority order, generated diagram data, rendered caption and highlights, prepared-batch equivalence, lint, build, and diff validity. Find and open a fresh strict Phase 1 loop, terminating branches that enter Phase 2.

## Scope

Do not change rendered Rule S or Rule V wording, priority order, Rule T, Rule W, king closer, Black's reply policy, or phase detection.
