# Two Bishops King Closer Design

## Goal

Add a fifteenth Two Bishops White priority that favors bringing White's king
closer to Black's king after all existing priorities tie.

## Visible rule

Append this rule after `coordinate bishops`:

> **king closer** — Minimize distance from White's king to Black's king.

## Evaluator behavior

Score the position resulting from each legal White move. Measure the Chebyshev
distance between the two kings: the number of unobstructed king moves between
their squares. Lower distance is better.

The rule is the final tie-breaker. It does not override mate, safety, phase 2,
bishop formation, or bishop coordination. Bishop moves normally tie at this
priority because neither king changes square.

If either king is unexpectedly absent, use a high fallback value so the scorer
remains total on malformed input.

## Verification

- Pin `king closer` as the fifteenth and final Two Bishops White rule.
- Pin its exact short label and help text.
- Directly compare two legal king moves and assert that the move producing the
  lower king-move distance wins this priority.
- Update only fixtures whose final tie is now broken by the new rule.
- Run focused Two Bishops and presentation tests, lint, build, and a diff check.
- Report unrelated pending Rook-policy failures separately.
