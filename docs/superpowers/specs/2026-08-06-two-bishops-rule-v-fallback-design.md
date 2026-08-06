# Two Bishops Rule V Fallback

## Goal

Make the rule-v exception conditional on an actually available rule-v move. In `8/8/8/8/3KBk1B/8/8/8 w - - 22 12`, the unsafe checks `Bg5+` and `Bg3+` are removed by `pieces safe`; rule z must therefore remain active and uniquely select `Bf6`.

Use the refined visible rule text:

> Phase 1: If rule y is satisfied and the king already controls the target square, check the king, from not the target square.

## Design

At the rule-z stage, inspect the candidates that survived all earlier priorities. A rule-v move is available only when a survivor satisfies all three conditions: White's king already controls a Phase 1 target square in the starting position; after the move, one bishop controls both common-adjacent Rule-Y squares; and the move gives check from a square other than the target. Rule Y is satisfied exactly when `ruleYControlledAdjacentCount` is 2.

When such a survivor exists, skip rules z, y, x, and w and let rule v select it. When none exists, run rules z through w normally; rule v will find no satisfying survivor and will not disturb the fallback result.

Implement the branch with group-level subpriority predicates. This is preferable to precomputing availability during position scoring, which would duplicate the earlier guard pipeline, and preferable to moving rule v, which would change the requested visible order.

Rule x keeps its existing special comparison: non-attacked-bishop candidates remain tied with the best attacked-bishop move, while inferior moves of an attacked bishop are removed.

## Verification

Add a regression asserting that `Bf6` is uniquely ideal under rule z in the supplied position. Update the positive rule-v regression to prove a safe check satisfying Rule Y still bypasses z through w, and add a negative check that loses Rule-Y control and therefore does not trigger the bypass. Update the rendered help copy, independent priority-pipeline test, and rule-shape assertions, then run TypeScript, lint, diagram validation, and the Mate tests. Finally, find and open a fresh Phase 1 loop, treating entry into Phase 2 as termination.
