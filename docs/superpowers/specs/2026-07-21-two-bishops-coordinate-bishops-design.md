# Two Bishops Coordinate Bishops Design

## Goal

Replace three late Two Bishops heuristics with one memorable coordination
priority.

## Visible rule

Remove:

- `king near bishops` — Keep White's king near the bishops.
- `force black to edge` — Force Black to the edge.
- `bishops closer to black king` — Bring the bishops closer to Black's king.

Add in their place:

> **coordinate bishops** — Force Black's king away from the bishops.

## Evaluator behavior

`coordinate bishops` retains the meaningful bishop-pressure comparison from
the former `bishops closer` rule: minimize the sum of the two bishops'
Chebyshev distances to Black's king after White's move. Bringing the bishops'
wall toward Black is how White forces Black to retreat on its reply.

Remove the former White-king-to-bishops score and the Black-king-edge score.
The edge score cannot distinguish White candidate moves because Black's king
does not move during White scoring. The separate White-king proximity
heuristic is intentionally removed.

The existing `bishops together` rule remains immediately before
`coordinate bishops`, so coordination first keeps the bishops adjacent and
then brings their wall toward Black.

## Verification

- Pin the new rule ID, short label, help text, and order.
- Remove literal expectations for all three former rule IDs.
- Update affected moves, hints, explanations, and Black replies to the new
  ordered evaluator output.
- Assert directly that lower bishop-to-Black distance wins the consolidated
  priority.
- Run focused Two Bishops and presentation tests, lint, build, and a diff
  check. Report pending Rook-policy failures separately.
