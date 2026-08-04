# Sequester Priority Swap Design

## Goal

After preserving edge confinement, make Black's progress toward White's proximate corner more important than White king proximity to the knight-support square.

## Design

Retain all existing Sequester score calculations. Change only the lexicographic comparison order to:

1. `sequesterEdgeEscapePenalty`
2. `sequesterNonCornerApproachReplyCount`
3. `sequesterCornerSupportDistance`

Keep the support distance as squared Euclidean distance. Update the rendered text to: "Phase 2: Ensure Black cannot leave the edge. Prefer forcing Black's king towards White's king's proximate corner, then prefer keeping White's king closer to the square a knight's move from the corner."

The policy remains board-position-only and symmetric.

## Verification

Update semantic tests to prove corner direction outranks the support distance while retaining direct sum-square assertions. Run focused Two Bishops tests, TypeScript, and the fail-fast development gate. Do not run the full mate suite, commit, push, deploy, or synchronize the plan archive.
