# Temporarily Disable Two Bishops Rule Y

## Goal

Temporarily prevent Rule Y from affecting Two Bishops move selection without deleting its scoring implementation, rendered guide copy, or priority position.

## Design

- Add a named Rule Y enable flag set to `false`.
- Include the flag in Rule Y's applicability score.
- Preserve the Rule Y score fields and comparator so restoring the rule requires changing only the flag.
- Keep Rule Y visible in the priority guide with unchanged text.

## Verification

- Assert that Rule Y does not apply in a position that otherwise meets its king-distance condition.
- Assert that the next applicable rules determine recommendations and explanations.
- Run the focused Two Bishops and presentation tests, build, lint, generated-asset checks, and a strict Phase 1 loop search.

## Assumption

“Temporarily disable” means disable Rule Y's evaluator effect while leaving its guide entry visible and its implementation available for restoration.
