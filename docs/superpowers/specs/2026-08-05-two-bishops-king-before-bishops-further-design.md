# Two Bishops King-Before-Bishops-Further Design

## Goal

Swap the `king closer` and `bishops further` priorities in the Two Bishops White policy.

The resulting tail is:

1. `prep restricted area`
2. `king closer`
3. `bishops further`
4. `check`

## Behavior

Run all existing `king closer` comparisons before considering the combined squared-Euclidean distance of the bishops from Black's king. `bishops further` therefore breaks only ties that survive `king closer`.

Preserve both rules' wording, score formulas, phase gates, and reason IDs. Preserve every other priority and all Phase 2 behavior.

## Integration

Move the complete registered `king closer` rule object immediately before `bishops further`. Update the visible rule-ID expectation, rendered order assertion, and independent priority-pipeline test to apply `king closer` before filtering by `bishopsFurtherDistance`.

No diagram or score-field changes are required.

## Verification

- Assert the exact registered and rendered order.
- Keep the direct metric tests for both rules.
- Run the focused Two Bishops and presentation tests, TypeScript, lint, diagram freshness, and diff checks.
- Find and open an exact current-policy Phase 1 loop, treating entry into Phase 2 as termination.
