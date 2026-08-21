# Two Bishops Onsides All-Axes Design

## Rule

> **onsides** — Move a bishop behind Black's king as close as possible to the square behind White's king from Black's king's perspective.

Only a bishop starting on Black's side of every active king moat is offsides and eligible to move. A preferred destination uses the shortest nonzero file/rank differential between the kings. When both dimensions differ, it lies beyond Black away from White on that shorter dimension and remains level with Black on the other dimension. If the differentials tie, neither axis supplies a behind-Black exception; the bishop must instead cross onto White's side of an active moat. When the kings align on one dimension, the other dimension defines the entire behind rank or file. If the board contains no square behind Black in the required direction and no active moat can be crossed, every bishop is already onsides, the rule is inactive, and bishop distance scores both bishops. Among reachable behind destinations, prefer the smallest squared Euclidean distance to the square one step beyond White's king. If no behind destination is reachable, apply that same distance comparison to destinations that cross onto White's side of an active moat. Aligned kings define a midpoint moat even outside the existing knight-step and opposition geometries. The rule is inactive when neither bishop starts offsides or no eligible bishop can reach either kind of qualifying destination.

## Verification

Add a focused all-axis regression, including equal king differentials targeting the square one step beyond White's king, update the rendered rule text, compile TypeScript, and load a verified loop at `cursor=0`.
