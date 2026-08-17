# King Closer Middle-First Design

## Goal

Make King Closer prioritize White king proximity to the middle 16 squares, using squared Euclidean distance to Black's king only as a tiebreaker.

## Behavior

The existing King Closer score fields remain unchanged:

- `kingCloserMiddleSixteenDistance` measures distance from White's resulting square to the inclusive `c3`–`f6` region.
- `kingCloserDistance` measures squared Euclidean distance between the kings after White's move.

The comparator orders moves by:

1. Lower `kingCloserMiddleSixteenDistance`.
2. Lower `kingCloserDistance` when the middle-16 scores tie.

The rule remains global to both phases. Its rendered English is unchanged.

## Regression coverage

- In `8/8/8/8/K7/3B4/8/k3B3 w - - 0 1`, `Kb4` beats moves that leave White farther from the middle 16 even when those moves are closer to Black's king.
- When two moves are equally close to the middle 16, squared Euclidean distance to Black's king breaks the tie.
- Existing rendered rule text remains unchanged.
