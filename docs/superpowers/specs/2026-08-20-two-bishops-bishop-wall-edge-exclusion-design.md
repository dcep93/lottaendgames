# Two Bishops Bishop Wall Edge Exclusion Design

## Goal

Keep the existing `bishop wall` geometry, priority, copy, and diagram, but make the rule inactive whenever Black's king is on a board edge, including a corner.

## Behavior

Reject the wall match before transformed geometry is evaluated when `edgeDistance(blackKing) === 0`. Because White moves cannot relocate Black's king, the starting and resulting positions share the same eligibility. Interior translated, rotated, and reflected wall positions remain eligible.

## Verification

Add a regression using `8/8/8/5K2/5B1k/5B2/8/8 w - - 0 1` proving `Kg6` does not activate `bishop wall`, while retaining the supplied interior `Be4` symmetry tests. Run focused Two Bishops tests and a bounded loop search, then load the verified loop at `cursor=0`.
