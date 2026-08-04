# Two Bishops Sequester: Bishops Farther

## Rule

Render:

> **sequester** — Phase 2: Force Black's king towards the target corner, preferring bishops farther from the target corner.

Keep both comparisons inside this one visible priority and apply them lexicographically:

1. Minimize the maximum Manhattan distance of Black's legal reply squares from the target corner.
2. Among tied candidates, maximize the sum of the two resulting bishops' squared Euclidean distances from the same target corner.

The target corner remains the corner on Black's edge closest to White's resulting king square.

## Constraints

- Use only the candidate move's resulting board.
- Preserve D4 symmetry and universal safety priorities.
- Do not add another visible rule or hidden comparison.
- If no target corner exists, use a neutral bishop-distance score so the secondary comparison does not choose a move.

## Verification

Add a focused fixture where Black-reply progress ties and bishop distance decides the survivor. Check D4 transforms and exact rendered copy. Run focused Two Bishops rules, directly affected presentation, TypeScript, diagram consistency, diff checks, and the fail-fast loop search.
