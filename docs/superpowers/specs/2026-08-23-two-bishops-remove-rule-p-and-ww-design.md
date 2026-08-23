# Remove Two Bishops Rules P and WW

## Goal

Remove Rule P and Rule WW completely from the Two Bishops policy and Training Info.

## Policy

Delete both rules from the active priority list and rule catalog. The resulting local order is:

`rule q` → `rule w1` → `rule w2` → `king closer`

Rule W2 continues to use the tightest functional Phase 2 wall. Rule WY and the shared wall geometry remain unchanged.

## Implementation

Remove Rule P and Rule WW score fields, position-context data, candidate selectors, scoring, descriptions, and rule-specific tests. Update any broader test whose expected ideal move changes because the removed priorities no longer intervene.

Do not retain disabled catalog entries or dead implementation.

## Verification

- Verify neither rule appears in the active or rendered policy.
- Verify the new priority order.
- Verify remaining wall rules and symmetries.
- Run focused tests, build, lint, and `git diff --check`.
- Generate and inspect a fresh loop, state whether each Black reply is ideal or merely legal, and load it at `cursor=0`.
