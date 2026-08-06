# Two Bishops Rule U

## Goal

Add `rule u` immediately after rule v:

> Phase 1: Prefer bishops further from Black's king, and not on an edge.

## Design

For each resulting White bishop, contribute zero when it is on a board edge; otherwise contribute its Chebyshev distance from Black's king. Sum both bishop contributions and maximize the total among surviving Phase 1 candidates.

This directly implements the clarified scoring direction: `edge ? 0 : distance`, maximized. Summing treats both bishops symmetrically and allows later rules to break equal combined scores. The rule is inactive for Phase 2 result positions.

Insert rule u after rule v and before `unclutter bishops`. Do not change rule-v fallback, rule-x behavior, Phase 2 detection, or the later `king closer` and `check` priorities.

## Verification

Add direct scoring tests for edge exclusion, greater Chebyshev distance, two-bishop summation, Phase 1 applicability, Phase 2 inactivity, and D4 symmetry. Update the registered-rule order, independent priority pipeline, and rendered guide-copy expectations. Run the focused Two Bishops and presentation tests, TypeScript, lint, and diagram validation. Finally, find and open a directly playable loop that remains in Phase 1; reaching Phase 2 terminates loop search.
