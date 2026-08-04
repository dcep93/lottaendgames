# Two Bishops: split Bishops Away from Sequester

## Goal

Expose the final bishop-distance comparison as its own visible priority immediately after `sequester`, without changing which moves survive.

## Rules

Render these consecutive priorities:

1. **sequester** — Phase 2: Force Black's king towards the target corner, or otherwise use a bishop to control the square two away from Black's current square.
2. **bishops away** — Phase 2: When deciding between bishop moves, prefer larger distance from the target corner.

`sequester` retains its Black-reply progress comparison and its conditional two-away control comparison. `bishops away` owns the existing summed squared-Euclidean bishop-distance comparison.

## Mechanical behavior

The new rule activates only in Phase 2 and only when every survivor reaching it is a bishop move. It maximizes the existing sum of both resulting bishops' squared Euclidean distances from the current-board target corner. This preserves the former third `sequester` subpriority exactly while giving eliminated moves the more specific `bishops away` reason.

No target-corner definition, score calculation, safety rule, phase classifier, or move-selection result changes.

## Verification

- Assert the rendered rule order and exact copy.
- Assert `sequester` now has two subpriorities and `bishops away` owns the former comparator.
- Preserve the D4 bishop-distance fixture and confirm its recommendation set is unchanged.
- Run focused Two Bishops rule tests, directly affected presentation tests, targeted TypeScript, diagram consistency, and diff checks.
- Produce one refreshable localhost loop from the unchanged policy.
