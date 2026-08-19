# Two Bishops Onsides Target

## Goal

Update `onsides` to move an offsides bishop behind the moat as close as possible to the square behind White's king from Black's perspective.

## Behavior

The target is one king step from White directly away from Black on every differing coordinate axis. Candidate bishop moves must begin on Black's side of the active knight-step or opposition moat and finish on White's side. Rank candidates by squared Euclidean distance from their destination to the target. Later rules break ties.

## Verification

Test the supplied position, transformed target selection, rendered copy, TypeScript, and an exact replayed loop loaded in the sidebar.
