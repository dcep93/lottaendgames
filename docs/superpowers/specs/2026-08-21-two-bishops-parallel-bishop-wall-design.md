# Parallel Bishop Wall Design

## Goal

Update the rendered rule:

> **bishop wall** — Achieve adjacent bishops with Black's king across the moat and White's king 2 steps from Black's king. Kings and bishops should be parallel.

## Geometry

Keep every existing bishop-wall requirement. Additionally require the line joining the kings to be parallel to the line joining the adjacent bishops. Horizontal bishop adjacency requires kings on the same rank; vertical bishop adjacency requires kings on the same file. Opposite direction along the same axis is accepted.

The loaded position with bishops `d5/e5` and kings `d1/d3` is not a bishop wall because the bishops are horizontal while the kings are vertical.

## Implementation

Add the parallel-axis gate inside `isBishopWallPosition` before evaluating the existing supported shapes. Update the rendered help text without changing priority order.

## Verification

Add a focused regression for the loaded mismatch, retain the existing symmetry and valid-wall tests, then find and load a fresh current-policy loop at `cursor=0` with an incorrect escape that continues to mate.
