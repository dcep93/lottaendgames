# Two Bishops Rules AB and F Design

## Priority additions

Add two Phase 1 priorities to the current Two Bishops sequence:

- **rule ab** — If rule a is satisfied, force black to take opposition or else go away from the king moat.
- **rule f** — Prefer the bishops closer to white's king.

The visible and scoring order becomes `rule a`, `rule ab`, `rule b`,
`rule c`, `rule d`, `rule e`, `rule f`, then `king closer`.

## Rule AB

Rule AB is a staged priority. It applies only when the starting position already
satisfies Rule A's flank-diagonal condition.

For each candidate White move, evaluate every legal Black reply. A reply
qualifies when either:

1. the resulting kings are in direct rank or file opposition; or
2. Black's king has strictly increased its orthogonal distance from at least
   one king-moat line present in the starting position.

The candidate satisfies Rule AB only when every legal Black reply qualifies.
Entering Phase 2 does not change Rule AB's Phase 1-only applicability at the
starting position.

## Rule F

Rule F compares the resulting positions by summing each bishop's squared
Euclidean distance from White's resulting king square. Prefer the smaller sum.
This treats both bishops equally and avoids introducing an additional
tie-breaker within the rule.

## Verification

Pin the exact rendered wording and priority order. Add direct Rule AB fixtures,
including a failing Black reply, and Rule F distance comparisons. Verify board
symmetry and Phase 2 inactivity. Run focused tests, lint, build, generated
diagram freshness, and find a fresh strict Phase 1 loop where entering Phase 2
terminates the branch.
