# Two Bishops Rules P and Q Design

## Goal

Rename Rule Z to Rule P, rename Rule A to Rule Q, and place both immediately before `king closer`.

## Priority order

The relevant registered order becomes:

1. `unclutter bishops`
2. `rule p`
3. `rule q`
4. `king closer`
5. `rule b`
6. `check`

Rule P keeps the existing inward-flank geometry and scoring. Rule Q keeps the existing knight-step flank geometry and scoring. Rule B and `king closer` remain otherwise unchanged.

## Complete rename

- Rename the public rule IDs and short labels.
- Rename the corresponding score and position-context fields.
- Rename Rule Q's generated diagram key, note-board ID, title, generator labels, and test variables.
- Do not retain Rule Z or Rule A aliases.
- Historical design documents remain historical records and are not rewritten.

## Verification

- Update the independent priority-order simulation and expected visible order.
- Preserve Rule P and Rule Q geometry, phase, and D4-symmetry coverage.
- Verify that current app code and rendered markup contain no Rule Z/A identifiers.
- Run the Two Bishops and presentation suites, typecheck, lint, and diagram validation.
- Find and open a fresh Phase 1 loop, treating Phase 2 entry as termination.
