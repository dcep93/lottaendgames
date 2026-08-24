# Two Bishops Rule G Corner-Knight Distance Design

## Goal

Add **rule g** immediately before **rule n**: in Phase 2, prefer White's king closer to a square a knight's move from Black's proximate corner.

## Geometry and scoring

- Determine Black's proximate board corner from the starting position using minimum king/Chebyshev distance.
- Preserve every tied proximate corner so the behavior remains symmetric.
- Collect every on-board square a knight's move from those corners.
- Score each legal White move from its resulting White-king square using the minimum squared Euclidean distance to those target squares.
- Prefer the smaller score. Squared Euclidean distance produces exactly the same ordering as Euclidean distance without a square root.
- Apply the priority only when the starting position is Phase 2.

## Priority and presentation

The active order becomes `rule g`, `rule n`, `rule o`, `rule w2`, `rule w3`, `rule w`. Training Info shows the requested Rule G text and adds no diagram.

## Verification

- Test Phase 2 gating, post-move distance ranking, tied-corner behavior, and all rotations/reflections.
- Update exact active-policy and Training Info ordering assertions.
- Run the focused Two Bishops suite, build, lint, and diff checks.
- Find, independently validate, and load an h1-oriented loop at `cursor=0`.
