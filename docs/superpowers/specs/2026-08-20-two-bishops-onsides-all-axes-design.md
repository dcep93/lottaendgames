# Two Bishops Onsides All-Axes Design

## Rule

> **onsides** — Move a bishop behind Black's king as close as possible to the square behind White's king from Black's king's perspective.

For each nonzero Black-to-White file and rank direction, a qualifying destination must lie beyond White's king in that direction. Among qualifying bishop moves, prefer the destination with the smallest squared Euclidean distance to the square one step beyond White's king. The rule is inactive when no bishop has a qualifying move.

## Verification

Add a focused all-axis regression, update the rendered rule text, compile TypeScript, and load a verified loop at `cursor=0`.
