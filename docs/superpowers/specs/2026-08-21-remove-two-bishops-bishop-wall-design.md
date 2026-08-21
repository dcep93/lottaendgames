# Remove the Two Bishops Bishop-Wall Rule

## Goal

Remove `bishop wall` completely from the Two Bishops white-move policy and training guide.

## Changes

- Delete the ordered rule and its rendered help text.
- Delete bishop-wall scoring fields, position context, selection helpers, and geometry used only by that rule.
- Delete the bishop-wall note-board diagram and generated diagram source.
- Delete or revise bishop-wall-specific tests while retaining coverage of the surrounding rule order.
- Leave all other rules and their relative order unchanged.

## Verification

- Confirm `bishop wall` is absent from the rule list and training help.
- Run focused Two Bishops rule-order and diagram checks.
- Find a fresh literal policy loop, verify its rules and escape-to-mate continuation, and load it at `cursor=0`.
