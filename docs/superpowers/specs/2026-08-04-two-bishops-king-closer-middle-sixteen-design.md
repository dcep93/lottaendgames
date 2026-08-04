# Two Bishops King Closer Middle-Sixteen Design

## Goal

Refine the final `king closer` comparison so equally close Phase 1 king moves
prefer a destination in the middle sixteen squares.

## Geometry

The middle sixteen squares are the central four-by-four area: files `c` through
`f` and ranks `3` through `6`. Membership is inclusive and D4-symmetric.

## Comparison Order

The existing `king closer` rule remains one visible priority. Its comparisons
run in this order:

1. Preserve the existing Phase 2 rank/file-line preference.
2. Minimize the resulting Manhattan distance between the kings.
3. In Phase 1 only, prefer a resulting White king square in the middle sixteen.

The middle-sixteen comparison is a tie-break. It never chooses a farther king
move over a closer one. It is neutral in Phase 2, so this Phase 1 change does not
alter 2b's policy surface.

The visible help text becomes:

> Bring White's king closer to Black's king, preferring the middle 16 squares.

## Current Loop

In `5k2/8/3K4/5BB1/8/8/8/8 w - - 0 1`, `Kd7` and `Ke6` both leave the kings
three Manhattan steps apart. `e6` is in the middle sixteen and `d7` is not, so
`Ke6` becomes uniquely correct.

## Verification

Add focused tests for the current loop position, all D4 equivalents, and the
inclusive `c3`/`f6` versus exclusive neighboring-square boundary. Preserve
tests proving a closer outside move beats a farther central move and Phase 2
recommendations are unchanged. Update rule and rendered-copy snapshots, then
run all Two Bishops and presentation tests, TypeScript, diagram freshness, and
diff checks.

Finally, run the Phase 1-only loop finder with entry into Phase 2 treated as
successful termination and provide a working port-5174 replay link.
