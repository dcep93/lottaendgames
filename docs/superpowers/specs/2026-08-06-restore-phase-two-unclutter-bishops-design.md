# Restore Phase 2 Unclutter Bishops

## Goal

Limit `unclutter bishops` to Phase 2 and restore the visible wording `Phase 2: Prefer bishops more than two king steps from a corner.`

## Design

Keep the rule in its current priority position and keep its existing metric: fewer bishops within two king steps of any corner is better. Add an applicability predicate based on each candidate move's resulting `isPhaseTwoPosition` score.

Phase 1 candidates bypass `unclutter bishops` and continue to `king closer`. Candidates whose move results in Phase 2 are eligible immediately, matching the result-position phase convention used by the surrounding Two Bishops evaluator.

Do not change Phase 2 detection, the corner-distance metric, rule order, rule-v fallback, or rule-x behavior.

## Verification

Update direct rule-shape, ordered-pipeline, and presentation-copy expectations. Assert that the rule is inactive for Phase 1 scores and active for Phase 2 scores while retaining its comparison and D4 symmetry. Run the focused Two Bishops and presentation tests, TypeScript, lint, and diagram validation. Finally, find and open a directly playable loop that remains in Phase 1, treating entry into Phase 2 as termination.
