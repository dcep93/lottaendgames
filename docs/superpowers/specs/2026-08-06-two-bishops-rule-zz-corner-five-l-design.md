# Rule ZZ Corner-Five L Design

## Goal

Change Rule ZZ so it penalizes bishops in the five-square L at each corner,
rather than the existing six-square corner triangle.

For the `a1` corner, the penalized squares are exactly `a1`, `a2`, `a3`,
`b1`, and `c1`. The same geometry is reflected and rotated for the other
three corners. In particular, `b2` is not penalized.

## Implementation

Keep Rule ZZ in its current Phase 1 priority position. Count a bishop when it
shares a file or rank with a corner and is no more than two squares from that
corner. Continue preferring fewer counted bishops.

Update the visible help text to: “Phase 1: Keep bishops out of the corner
5-square L.” No other rule or phase behavior changes.

## Verification

Add direct boundary coverage showing that all five L squares are penalized and
the former sixth square is excluded under every board symmetry. Preserve the
existing priority and Phase 2 inactivity tests, then run the full Two Bishops
and presentation suites, typecheck, lint, and diagram verification.
