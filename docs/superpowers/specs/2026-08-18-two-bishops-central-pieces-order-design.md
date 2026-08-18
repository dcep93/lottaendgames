# Two Bishops Central Pieces Order Design

## Goal

Move `central pieces` below both `king closer` and `unscreen bishops` in the Two Bishops White-rule priority list.

## Rule order

The affected tail changes from:

1. `rule w`
2. `central pieces`
3. `king closer`
4. `unscreen bishops`
5. `bishop distance`

to:

1. `rule w`
2. `king closer`
3. `unscreen bishops`
4. `central pieces`
5. `bishop distance`

## Scope

- Move the existing `central pieces` rule definition without changing its score calculation, applicability, label, or help text.
- Update exact-order and rendered-presentation assertions.
- Preserve all other Two Bishops rules and behavior.

## Verification

- Run the focused Two Bishops rule and presentation tests.
- Run the app build, lint, and generated-asset checks.
- Find a strict Phase 1 loop, treating entry into Phase 2 as termination, and open it on the local server.
