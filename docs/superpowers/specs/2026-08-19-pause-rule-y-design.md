# Pause Rule Y Design

## Goal

Temporarily prevent Rule Y from affecting Two Bishops move selection without deleting its implementation or rendered guide entry.

## Behavior

- Keep Rule Y in the visible priority list with its current wording.
- Keep its scoring fields and threat-detection implementation intact.
- Make the priority's applicability predicate always return false.
- Preserve its position between Rule W and king closer so re-enabling it is a one-line change.

## Verification

Add a focused test that Rule Y is visible but inactive, run the Two Bishops and presentation suites, then find and audit a Phase 1 loop while treating Phase 2 as terminal.
