# Two Bishops King-Closer Order Design

## Goal

Move `king closer` ahead of Phase 1 Rules Z, A, and B without changing any rule's scoring definition.

## Priority order

The relevant registered order becomes:

1. `unclutter bishops`
2. `king closer`
3. `rule z`
4. `rule a`
5. `rule b`
6. `check`

The registered rule list remains the single source for evaluator behavior, explanation reasons, and the rendered priority guide.

## Verification

- Update the expected rule IDs and visible guide order.
- Update the independent ordered-comparison test so it applies `king closer` before Rules Z, A, and B.
- Preserve direct geometry and scoring tests for all four rules.
- Run the Two Bishops and presentation suites, typecheck, lint, and diagram validation.
- Find and open a fresh Phase 1 loop, treating Phase 2 entry as termination.
