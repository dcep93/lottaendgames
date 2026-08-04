# Two Bishops Sequester Forcing-First Design

## Goal

After preserving edge confinement, make Black's forced progress toward White's proximate corner more important than White king proximity to the corner's knight-support square.

## Rendered Rule

> **sequester** — Phase 2: Ensure Black cannot leave the edge. Prefer forcing Black's king towards White's king's proximate corner, then prefer keeping White's king closer to the square a knight's move from the corner.

## Mechanical Order

Keep all existing score calculations and compare candidates lexicographically:

1. Minimize `sequesterEdgeEscapePenalty`, preferring candidates whose legal Black replies remain on an edge.
2. Minimize `sequesterMaximumCornerReplyDistance`, Black's worst raw post-reply Manhattan distance to White's proximate corner.
3. Minimize `sequesterCornerSupportDistance`, White king's sum-square distance to the appropriate knight-support square.

Only the second and third comparisons swap. No distance formula, phase condition, or move generation changes.

## Verification

- Assert the exact rendered copy and the three-subpriority order.
- Update the manual displayed-order selector calculation.
- Replace the support-first conflict fixture with a forcing-first semantic assertion.
- Preserve direct tests of edge confinement, raw reply distance, and sum-square support distance.
- Run focused Sequester, rule-order, and overlapping Unmask tests; targeted TypeScript; and diff hygiene.
- Run the small fail-fast Two Bishops gate and return one verified localhost loop.

## Non-goals

- Do not change the score formulas, rule order relative to other rules, phase classification, Black priorities, diagrams, or other mating rules.
- Do not run the full mate suite, commit, push, deploy, or synchronize the plan archive.
