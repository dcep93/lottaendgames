# Rook Geometric Attack Design

## Goal

Make “attacked rook” mean that Black's king attacks the rook's square,
regardless of whether White's king defends the rook.

## Behavior

- A rook is attacked when it is one king move from Black's king.
- White's defense of that rook does not change the classification.
- When the attacked-rook branch of `rook box` applies, retain the existing box
  and maximize the rook's distance from Black as the current rule describes.
- Quiet rook moves keep their existing priorities.

For `8/6k1/7R/6K1/8/8/8/8 w - - 0 1`, the rook on h6 is attacked even though
White's king defends it. `Ra6` therefore outranks the other moves along rank 6.

## Implementation

Replace the current “exposed rook” prerequisite, which requires an adjacent
Black king and no adjacent White king, with geometric Black-king adjacency.
Keep the existing result-safety and box-preservation requirements.

## Verification

- Add a regression test proving `Ra6` is the unique recommended move.
- Confirm the score records a larger attacked-rook distance for `Ra6` than
  `Rg6+`.
- Run the focused Rook rule and geometry tests.
- Run the exhaustive Rook loop verifier once, at low priority, and report the
  next loop if one remains.
