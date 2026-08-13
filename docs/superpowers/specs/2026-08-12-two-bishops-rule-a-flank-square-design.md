# Two Bishops Rule A Flank Square Design

## Goal

Replace the Phase 1 `rule a` inward-opposition behavior with a knight-step flank-square rule and add an exact-position teaching diagram.

## Rendered rule

**rule a** — Phase 1: When the kings are a knight's move apart, use a bishop to control the flank square.

The flank square is the square adjacent to Black's king and also a knight's move from White's king.

## Geometry and scoring

- Rule A applies only in Phase 1 and only when the two kings are a knight's move apart.
- Determine the flank square by intersecting the legal board squares adjacent to Black's king with the squares a knight's move from White's king, excluding the kings' occupied squares.
- A candidate receives Rule A's preferred score only when it is a bishop move and, after the move, a bishop has a clear diagonal line to the flank square.
- Occupying the flank square does not count as controlling it.
- Rule A remains immediately before `king closer`.

For `8/3B4/8/8/4K2B/8/3k4/8 w - - 0 1`, the kings are a knight's move apart, `c3` is the flank square, and `Bf6` controls it from `f6`.

## Diagram

Add a `rule a` note board using the exact supplied position. Highlight `c3` as the flank square and draw an arrow from `h4` to `f6`.

## Verification

- The supplied position uniquely prefers `Bf6` with reason `rule a`.
- Rotation and reflection transforms preserve the selection.
- Rule A is inactive in Phase 2 and when the kings are not a knight's move apart.
- The priority guide renders the exact new English and the `rule a` diagram.
- The generated diagram source remains current.
