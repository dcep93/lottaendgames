# Two Bishops Onsides All-Axes Design

## Rule

> **onsides** — Move a bishop behind Black's king as close as possible to the square behind White's king from Black's king's perspective.

A bishop is offsides only when it lies beyond Black away from White on every nonzero king-difference axis; equality with Black on an axis is allowed, and at least one axis must be strictly beyond Black. Prefer legal moves that minimize the resulting number of offsides bishops. When repairing an offsides bishop, require a safe destination and break ties by the smallest squared Euclidean distance to the square one step beyond White's king from Black's perspective. When no bishop starts offsides, the rule acts only as a preservation guard against moves that newly place a bishop offsides.

## Verification

Add focused regressions for all-axis geometry, equality with Black's coordinate, repair of an offsides bishop, and categorical rejection of moves that newly go offsides. Compile TypeScript and load a verified loop at `cursor=0`.
