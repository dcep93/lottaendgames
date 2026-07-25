# Queen Off-Edge Rule Copy

## Goal

Make the Queen guide's `white pieces off edge` explanation describe the
position White should maintain rather than a one-time movement instruction.

## Design

Keep the existing rule ID, title, evaluator order, and scoring unchanged.
Replace only the human-facing explanation:

> Keep White's pieces off edge squares.

The training-info modal and reason system already read this shared rule
description, so no component or layout changes are required.

## Verification

Update the literal rule-description assertion, run the focused Queen rule and
presentation tests, then run lint.
