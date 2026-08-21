# Two Bishops Onsides All-Axes Design

## Rule

> **onsides** — Move a bishop behind Black's king as close as possible to the square behind White's king from Black's king's perspective.

Only a bishop starting on Black's side of every active king moat is offsides and eligible to move. Every preferred destination must finish on White's side of at least one active moat and must be safe from attack by Black's next king move. Among those destinations, prefer the smallest squared Euclidean distance to the square one step beyond White's king from Black's perspective. Aligned kings define a midpoint moat even outside the existing knight-step and opposition geometries. The rule is inactive when neither bishop starts offsides or no eligible bishop can reach a qualifying destination.

## Verification

Add focused regressions for all-axis geometry, equal king differentials, and categorical rejection of destinations that remain offsides. Compile TypeScript and load a verified loop at `cursor=0`.
