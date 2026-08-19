# Two Bishops Rule U Primary Onsides Constraint

## Goal

Require Rule U's prospective primary squeeze-diagonal controller to reach that diagonal from White's side of the starting moat.

## Behavior

Rule U retains its knight-step, onside secondary-controller, distinct-bishop, opposition, and away-from-squeeze requirements. The other bishop must now have at least one legal move to the matched primary squeeze diagonal whose destination lies on White's side of the starting moat. A destination on the moat counts as onside. If none exists, Rule U is inactive.

## Verification

Run the focused Rule U symmetry tests, rendered-copy test, TypeScript check, and exact loop replay before loading the loop into the sidebar.
