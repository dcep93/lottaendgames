# Two Bishops Start Wall Proximate Gate Design

## Goal

Make the Phase 1 `start wall` rule stop only when White already has a wall that
is proximate to Black's king. An adjacent bishop pair elsewhere on the board is
not enough to disable the rule.

## Behavior

The existing rule order and public text remain unchanged. `start wall` accepts
a bishop move into two-square rank or file opposition with Black's king when:

- the position is Phase 1;
- neither bishop already holds two-square opposition with Black's king; and
- the starting bishops do not form a proximate wall under
  `getProximateBishopWall`.

If the bishops are adjacent but their wall is not proximate to Black's king,
`start wall` remains active. In
`BB6/8/8/8/8/2K5/4k3/8 w - - 10 6`, the remote `a8/b8` wall therefore does not
block `Be5`; that move places the bishop on `e5` in two-square opposition to the
black king on `e2`.

## Implementation

Reuse the `proximateWall` value already computed in the shared White-position
context. Replace the broad `hasStartingBishopWall` check in
`startWallPenalty` with a check that `proximateWall` is absent. Remove the now
unused generic adjacent-wall context field and helper if they have no other
callers.

This change does not alter the proximate-wall stencil, Phase 2 rules, rule
ordering, or the definition of two-square opposition.

## Verification

Add a focused regression proving `Be5` receives zero `startWallPenalty`, is an
ideal move, and is explained by `start wall` in the supplied position. Preserve
coverage showing that `start wall` remains inactive when the starting bishops
form an actually proximate wall and when a bishop already holds two-square
opposition. Run the focused Two Bishops rule tests and TypeScript checks.
