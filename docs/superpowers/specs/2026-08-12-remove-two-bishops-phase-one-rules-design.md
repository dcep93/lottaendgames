# Remove the Phase 1 Target-Strategy Rules

## Scope

Remove the ordered Two Bishops rules `rule zz`, `rule z`, `rule y`, `rule a`, `rule x`, `rule w`, `rule v`, and `rule u`.

Delete their rendered help entries, the Phase 1 Target Square note, their score fields and calculations, rule-only helpers, and tests that exist solely to specify those rules. Preserve all unrelated degenerate repairs and all Phase 2 rules and target-corner behavior.

## Resulting policy

After `phase 2 wall`, selection continues directly to the remaining rules. In Phase 1, the phase-gated Phase 2 rules remain neutral, so later universal safeguards or other applicable surviving rules decide the move. No replacement Phase 1 strategy is introduced in this change.

## Verification

Run the Two Bishops rule suite, presentation suite, TypeScript checks, lint, diagram validation, and diff hygiene. Then search for an exact Phase 1 policy cycle while treating entry into Phase 2 as successful termination, and open the resulting local loop on port 5173.
