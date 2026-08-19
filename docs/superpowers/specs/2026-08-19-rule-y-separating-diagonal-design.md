# Rule Y Separating-Diagonal Design

## Design

Rule Y will prefer only bishop moves that both prevent Black from attacking the other undefended bishop on the next move and travel along a diagonal separating the kings. Preventing the attack without separating the kings will receive no Rule Y credit. If no move satisfies both conditions, Rule Y will not eliminate any move and later priorities will decide.

The rendered text becomes: “Use a bishop to prevent Black from attacking the other undefended bishop on their next move, moving along a diagonal that separates the kings.”

## Verification

- Preserve the existing separating `Bd3` example and its transformations.
- Prove non-separating protection receives no Rule Y credit.
- Prove the former `Be3 Kd7 Bf4 Kc6` loop no longer begins with `Be3`.
- Run the focused Two Bishops tests, then find and audit a replacement Phase 1 loop.

## Assumption

The final clause is mandatory when Rule Y selects a move, not a tiebreak preference.
