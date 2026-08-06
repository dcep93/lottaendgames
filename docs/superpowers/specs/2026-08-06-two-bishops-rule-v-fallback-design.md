# Two Bishops Rule V Fallback

## Goal

Make the rule-v exception conditional on an actually available rule-v move. In `8/8/8/8/3KBk1B/8/8/8 w - - 22 12`, the unsafe checks `Bg5+` and `Bg3+` are removed by `pieces safe`; rule z must therefore remain active and uniquely select `Bf6`.

## Design

At the rule-z stage, inspect the candidates that survived all earlier priorities. A rule-v move is available only when a survivor both satisfies the source condition—White's king already controls a Phase 1 target square—and gives check from a square other than the target.

When such a survivor exists, skip rules z, y, x, and w and let rule v select it. When none exists, run rules z through w normally; rule v will find no satisfying survivor and will not disturb the fallback result.

Implement the branch with group-level subpriority predicates. This is preferable to precomputing availability during position scoring, which would duplicate the earlier guard pipeline, and preferable to moving rule v, which would change the requested visible order.

Rule x keeps its existing special comparison: non-attacked-bishop candidates remain tied with the best attacked-bishop move, while inferior moves of an attacked bishop are removed.

## Verification

Add a regression asserting that `Bf6` is uniquely ideal under rule z in the supplied position. Keep the existing positive rule-v regression to prove a safe rule-v check still bypasses z through w. Update the independent priority-pipeline test and rule-shape assertions, then run TypeScript, lint, diagram validation, and the Mate tests. Finally, find and open a fresh Phase 1 loop, treating entry into Phase 2 as termination.
