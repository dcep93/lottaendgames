# Two Bishops Prepare Mate Onsides Constraint

## Goal

Require `prepare mate` to use an onsides bishop waiting move while maintaining the secondary squeeze diagonal.

## Behavior

The moved bishop must finish on White's side of the starting knight-step moat. A destination on the moat counts as onside. The resulting position must still have a bishop controlling the projected secondary squeeze diagonal, and the waiting move must not check.

## Verification

Cover an offsides rejection, existing positive behavior and symmetries, rendered copy, TypeScript, and an exact replayed loop loaded in the sidebar.
