# Rule Y: Protect the Other Undefended Bishop

## Design

Replace Rule Y with: “Use a bishop to prevent Black from attacking the other undefended bishop on their next move.”

Rule Y activates when an undefended bishop is under a legal one-move Black king-approach threat. A successful candidate must move the other bishop and ensure every legal Black reply neither captures the stationary threatened bishop nor leaves Black's king adjacent to it. “Undefended” retains the app's existing definition: White's king is not adjacent to the bishop.

Use legal-move simulation for both the starting threat and the resulting Black replies. Remove Rule Y's exact-three-step, adjacent-diagonal, diagonal-distance, checking, and between-kings scoring.

## Verification

Add a focused tactical fixture and its rotations/reflections, verify king moves and moves of the threatened bishop lose Rule Y, and update rendered-copy fixtures.
