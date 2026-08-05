# Two Bishops Unclutter Bishops Design

## Goal

Add a visible White priority immediately after `phase 2 wall`:

**unclutter bishops** — Prefer bishops more than two king steps from a corner.

## Mechanic

Score the resulting board after each legal White move. For each surviving White bishop, find its Chebyshev distance to the nearest board corner. A bishop is cluttered when that distance is at most two. Prefer moves with fewer cluttered bishops.

This treats the bishops independently, applies in both phases, ignores move history and FEN counters, and is invariant under every rotation and reflection of the board.

## Considered Alternatives

- Maximize the sum of both bishops' corner distances. Rejected because one very distant bishop could compensate for another bishop that still violates the rendered rule.
- Compare the two individual distances lexicographically. Rejected because it adds an unrendered secondary preference among moves with the same number of qualifying bishops.
- Minimize the count of bishops within two steps of a corner. Selected because it exactly matches the visible binary condition and leaves genuine ties intact.

## Ordering and Presentation

The rule is inserted immediately after `phase 2 wall` and before `adjacent bishops` in the existing White priority array. It uses the short label `unclutter bishops` and the exact help text `Prefer bishops more than two king steps from a corner.` No phase label or diagram is added.

## Verification

- Assert the rule order and rendered text.
- Assert that moving a bishop from distance two to distance three wins when earlier rules tie.
- Assert that bishops already farther than two steps remain tied under this rule.
- Assert D4-equivalent positions yield equivalent scores.
- Run the focused Two Bishops rule tests, affected presentation test, TypeScript, diagram consistency, and diff checks.
- Run the fail-fast development scan and report only an all-Phase-2 cycle.

## Assumptions

- “King steps” means Chebyshev distance.
- “More than two” means a minimum corner distance of at least three.
- The preference applies to both bishops independently and to both phases.
