# Rule Y Separating-Diagonal Tie-Break Design

## Scope

Extend the existing Two Bishops Rule Y without changing when the rule applies or which bishop must move.

Rendered text:

> Use a bishop to prevent Black from attacking the other undefended bishop on their next move. Prefer moving along a diagonal that separates the kings.

## Behavior

Rule Y continues to prefer moves by the other bishop that leave every legal Black reply unable to attack the stationary undefended bishop. Among equally protective moves, it prefers a bishop move whose travel diagonal places the two kings on opposite sides.

Protection remains the primary comparison. A separating move cannot beat a move that actually prevents the next-move attack.

## Implementation

Add a Rule Y separation penalty to the White-move score. Compute it only for bishop moves from the current square to the candidate square. The move's diagonal separates the kings when the kings lie strictly on opposite sides of its infinite diagonal. Compare this penalty after the existing Rule Y protection penalty.

## Verification

- Preserve the existing Rule Y protection regression and symmetry coverage.
- Add the supplied sequence as a regression and prove `Bd3` is preferred.
- Verify the rendered Rule Y copy.
- Run the targeted rule and presentation tests, lint, and build.

## Assumptions

- “Prefer” means tie-break, not a mandatory condition.
- “Diagonal” means the bishop's travel diagonal, extended across the board.
- A king lying directly on that diagonal does not count as being separated from the other king.
