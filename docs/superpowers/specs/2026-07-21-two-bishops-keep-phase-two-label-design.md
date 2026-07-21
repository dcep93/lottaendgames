# Two Bishops Keep Phase Two Label Design

## Goal

Rename the user-facing Two Bishops rule from `stay phase two` to
`keep phase two`.

## Behavior

The rule is displayed as:

> **keep phase two** — Enter or remain in phase 2.

Both the rule ID used by reasons and its short label change to
`keep phase two`, so the guide, hint, log, and highlighted reason agree.

The score field, phase-two geometry, comparator, and selected moves do not
change. Internal implementation names may retain “stay phase two” because they
describe the existing calculation and are not rendered.

## Verification

Update literal rule-order, hint, and reason fixtures. Run the focused Two
Bishops and presentation tests, lint, build, and a diff check.
