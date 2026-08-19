# Two Bishops Central King Priority

## Goal

Add `central king` immediately before `onsides`:

> Prefer the king in the middle 32 squares.

## Behavior

Score White's resulting king against the existing middle-32 mask: the middle six-by-six board area excluding that area's four corners. A king inside scores better than a king outside; bishops do not affect this rule.

## Verification

Test ordering, copy, inside/outside scoring, rendered presentation, TypeScript, and an exact replayed loop loaded in the sidebar.
