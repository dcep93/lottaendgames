# Remove Two Bishops Mate Prep Degenerate

## Goal

Remove `degenerate — mate prep` completely from the Two Bishops policy and guide. Positions that previously matched it must cascade to the next applicable visible rule.

## Scope

- Remove the mate-prep reason label and priority entry.
- Remove its D4 matcher and terminal king-move selector.
- Remove the mate-prep guide board and generated diagram fixture.
- Remove tests whose only purpose is to define or display mate prep.
- Preserve neighboring degenerate rules and general sequester behavior.

## Verification

Run the focused Two Bishops rule and presentation tests, diagram consistency check, TypeScript, and `git diff --check`. Do not run the full mate suite.

## Assumption

“Remove” means full excision, not a disabled or hidden selector.
