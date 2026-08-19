# Remove Two Bishops Onsides Rule

## Scope

Remove the `onsides` rule from the Two Bishops evaluator. The removal includes its score fields, position-context data, move-selection helper, registered priority rule, rendered help text, and dedicated tests.

## Behavior

`edge flank` will be followed directly by `boot scoot n block` in the rule order. No dormant or hidden `onsides` implementation will remain, and no other rule behavior or ordering will change.

## Verification

Update rule-order and presentation assertions, run focused Two Bishops and presentation tests, run lint and build, and find a fresh Phase 1 loop while treating entry into Phase 2 as termination.
