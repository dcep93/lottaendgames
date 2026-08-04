# Two Bishops King Closer Manhattan Design

## Goal

Make `king closer` measure closeness as the sum of file and rank distance.

## Behavior

- Replace squared Euclidean distance, `dx² + dy²`, with Manhattan distance, `|dx| + |dy|`.
- Apply the metric consistently in both phases because `king closer` is a single global visible rule.
- Keep the rendered text unchanged: `Bring White's king as close as possible to Black's king.`
- Preserve statelessness, D4 symmetry, and the rule's existing priority position.

## Verification

- Replace squared-distance fixtures with semantic Manhattan-distance assertions.
- Add the supplied loop position as a regression showing the intended king choice under `x + y` distance.
- Run focused Two Bishops rule tests, relevant presentation tests only if rendered behavior is affected, targeted TypeScript and diff checks, then the fail-fast Two Bishops loop search.

## Non-goals

- Do not add a Phase 2-only exception or change another distance metric.
- Do not alter the rendered rule text, run the full mate suite, commit, push, or deploy.
