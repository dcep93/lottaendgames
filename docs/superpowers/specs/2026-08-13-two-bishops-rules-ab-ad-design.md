# Two Bishops Rules AB–AD Design

## Priority order

Insert these Phase 1 rules before Rule A, in this order: Rule AB, Rule AA, Rule AC, Rule AD.

## Rules

- **rule ab** — When the kings are in opposition, use a bishop to control a square edge adjacent to Black's king, and not a square adjacent to White's king.
- **rule aa** — When rule ab is satisfied, check the king.
- **rule ac** — When the kings are a knight's move apart, and a bishop controls the square in opposition to White's king, take opposition.
- **rule ad** — When the kings are a knight's move apart, and a bishop controls the square a knight's move from White's king, and 2 squares from Black's king, and in one move the other bishop can control the diagonal adjacent to that square and Black's king, take opposition.

## Scoring

Rule AB applies when the starting kings are in direct opposition. It prefers result positions where at least one bishop controls an orthogonally adjacent square of Black's king that is not king-adjacent to White's king.

Rule AA applies only when the starting position already satisfies Rule AB. It prefers any legal check; it no longer requires the checking bishop to be adjacent to the controlling bishop.

Rules AC and AD identify the unique legal king move that takes direct opposition. Rule AC requires the stated opposition square to be controlled in the starting position. Rule AD requires one bishop to control its stated first square and the other bishop to have a legal bishop move that would control a diagonal containing a Black-king-adjacent square and an edge-adjacent square of the first controlled square.

All four rules are inactive in Phase 2. Rotations and reflections preserve their recommendations.
