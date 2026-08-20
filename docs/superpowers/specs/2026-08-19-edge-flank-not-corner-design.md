# Edge Flank Excludes Corners

## Design

Keep Edge Flank's existing geometry and priority, but make it inactive when Black's king occupies any corner.

Rendered text: "When the black king is on the edge, but not in the corner, flank diagonally."

## Verification

Add a focused corner/non-corner applicability regression, run the focused rule tests, and verify a local loop at `cursor=0`.
