# Two Bishops Sequester: Prevent Retreat

## Goal

Make `sequester` prefer the White move whose worst legal Black reply remains closest to the target corner. Only after that comparison ties should the rule use its two-away-square control fallback.

## Behavior

Keep the existing strict-progress and target-strength comparisons. Then compare `sequesterMaximumCornerReplyDistance` for every Phase 2 position, not only corner-diagonals targets. A lower maximum is better. If tied and no candidate forces progress, compare control or occupation of the two-away edge square.

In `8/8/1B6/1B6/8/2K5/8/1k6 w - - 0 1`, this makes `Be3` uniquely correct because its replies are limited to `Ka1` and `Ka2`; competing moves allow `Kc1`.

## Constraints

The correction remains stateless, D4-symmetric, and uses the existing rendered `sequester` concept. It adds no rule or exception.

## Verification

Add a D4 regression, then run focused Two Bishops rule/presentation tests, TypeScript, diagram consistency, and diff checks. Do not run the full mate suite.
