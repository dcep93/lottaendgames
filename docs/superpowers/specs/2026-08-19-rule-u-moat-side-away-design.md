# Rule U Moat-Side Squeeze Direction

## Rule

Render Rule U as:

> When the kings are a knight's move apart, a bishop controls the secondary squeeze diagonal from the white side of the moat, and a bishop can move to control the primary squeeze diagonal, take opposition away from the squeeze diagonal.

## Behavior

Replace Rule U's closer-wall condition with two eligibility requirements evaluated for each matching squeeze geometry after the candidate opposition move:

1. The bishop controlling the secondary squeeze diagonal must occupy a square on White's side of the starting king moat. A square on the moat counts as White's side.
2. White's king move must strictly increase its projection distance from that controlled secondary diagonal.

The other bishop must retain the existing ability to move to the matching primary squeeze diagonal. Primary and secondary roles remain distinct and belong to the same geometry.

Apply the rule symmetrically under rotations and reflections and in both phases.

## Alternatives Rejected

- Keeping the closer-wall test would encode a different condition than the revised rule.
- Naming absolute board directions would break rotation and reflection symmetry.
