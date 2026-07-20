# Two-square corner cage copy

## Goal

Rename the user-facing Queen rule from “stable two-square corner cage” to “two-square corner cage.”

## Scope

- Change the rule's short label to `two-square corner cage`.
- Remove `stable` from the matching help sentence so the concept has one visible name.
- Update exact-copy tests.
- Preserve the internal rule ID, scoring, and evaluator behavior.

## Verification

Run the focused major-piece rule tests and lint.
