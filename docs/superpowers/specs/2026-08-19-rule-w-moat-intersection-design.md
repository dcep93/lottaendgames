# Rule W Moat Intersection

## Scope

Keep Rule W's rendered text and priority unchanged.

For knight-step king geometry, derive the king moat from the midpoint between the kings. A Rule W flank pair qualifies only when both diagonals intersect that moat on the board. A diagonal whose mathematical intersection lies beyond the board does not qualify.

Keep the existing Black-file intersection rule for the separate two-diagonal-step king geometry.

## Regression

In `8/3B4/8/8/8/3K4/3B1k2/8 w - - 0 1`, `a4-d1` does not intersect the e-file moat. Therefore `Ba4` must not satisfy Rule W. The result must hold under rotations and reflections.

## Alternatives Rejected

- Requiring only one diagonal in the pair to intersect the moat still admits the invalid `a4-d1` diagonal.
- Treating intersection as a lower-priority score still lets an invalid geometry be labeled Rule W.
