# Two Bishops R10: Do Not Enclose White

## Goal

Change the priority text and behavior to:

> **rule r10** — Prefer controlling adjacent diagonals, not enclosing White, minimizing Black's confined area to the corner.

## Geometry

For each orientation where the bishops occupy adjacent parallel diagonals, Black must be strictly beyond one boundary toward a corner and White must be strictly beyond the opposite boundary. White on either boundary or on Black's corner-side does not qualify. Because the adjacent diagonal indices are consecutive integers, this strict opposite-side test completely excludes White from Black's confined region and the wall itself.

For qualifying orientations, retain the existing geometric corner-area count and prefer the smallest area. Keep `r12`, `r15`, universal priorities, and Black's policy unchanged. Add focused tests for White on the opposite side, inside Black's region, and on a boundary, then find and load the next exact loop.

