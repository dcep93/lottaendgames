# Two Bishops Wall White-King Area Exclusion Design

## Goal

An eligible bishop wall must keep Black inside its corner-to-wall area while White's king remains outside that area.

## Shared geometry

Apply the condition in `getTwoBishopsWalls` after computing a candidate wall's `areaSquares`:

- Black's king must be included in `areaSquares`.
- White's king must not be included in `areaSquares`.
- A White king on a wall diagonal remains eligible because the corner area excludes the diagonal itself.

Putting the condition in shared wall detection makes Phase 2 and Rules N, O, and W3 use the same eligibility definition.

## Training Info

Render the Phase 2 note as:

> Phase 2: There is an eligible functional bishop wall at least 4 diagonals from its corner, with Black restricted inside it and White's king outside Black's area.

## Validation

- Add a focused wall test proving an otherwise valid wall is rejected when White's king is inside Black's area.
- Prove the same geometry remains eligible when White's king is on or beyond the wall.
- Verify the condition under every board rotation and reflection.
- Run the focused four-rule tests, build, lint, and `git diff --check`.
- Generate and independently validate a closed loop, orient it so Black's closest corner is h1, and load it at `cursor=0`.
