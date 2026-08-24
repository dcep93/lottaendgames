# Two Bishops Result-Phase Rule G Design

## Goal

Make Phase 2 classification depend on the position after White's candidate move, so a move that establishes a qualifying bishop wall can immediately receive Phase 2 priorities.

## Decisions

- A functional bishop wall remains eligible when White's king is inside Black's corner-to-wall area; only Black must be restricted by the wall.
- Rule G evaluates each resulting position. It applies when that resulting position is Phase 2, even if the starting position is Phase 1.
- Rule G continues to prefer squared-Euclidean proximity to a square a knight's move from Black's proximate corner.
- In `8/8/8/8/7k/4BK2/8/3B4 w - - 0 1`, `Kf2` establishes Phase 2 and reaches the h1-corner target square exactly.

## Verification

- Add focused geometry and policy tests for the result-phase transition.
- Run the focused Two Bishops rule tests, build, and lint.
- Independently validate and load a repeating loop with Black oriented toward h1 and `cursor=0`.
