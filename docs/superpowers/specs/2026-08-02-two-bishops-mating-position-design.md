# Two Bishops Mating Position

## Goal

Give `mate in 3`, `sequester`, and the teaching diagram one exact definition of White's king mating position.

## Geometry

In the displayed orientation with Black's king on `h8`, White's king mating squares are `f8` and `f7`. Apply every D4 rotation and reflection to the whole pattern; the diagonal reflection produces the equivalent `h6` and `g6` pair. For an edge position where Black is not yet cornered, use the mating squares belonging to the nearest corner or tied nearest corners.

The mating-position distance is the minimum squared Euclidean distance from White's king to those squares. This preserves the existing sum-square convention while changing the targets from all corner-knight squares to the two taught mating squares.

## Rule Behavior

- `mate in 3` activates its corner pattern only when White's king occupies one of the corner's two mating squares. The existing exact mate-pattern recognition remains responsible for selecting a move.
- `sequester` keeps edge confinement and forcing Black toward White's proximate corner ahead of king placement, then minimizes distance to that corner's mating squares.
- Render:
  - **mate in 3** — Phase 2: With Black's king in the corner and White's king in a mating position, play mate in 3.
  - **sequester** — Phase 2: Ensure Black cannot leave the edge. Prefer forcing Black's king towards White's king's proximate corner, then prefer keeping White's king closer to a mating position.

## Diagram

Add a `mating position` note board with Black's king on `h8`, White bishops on `d4` and `c2`, no White king, and `f8` plus `f7` highlighted. The missing king invites the learner to place it on either highlighted square.

## Verification

Add focused tests for both canonical king squares, D4 symmetry, the new sequester distances, exact rendered wording, and exact diagram contents. Run focused Two Bishops rules, directly affected presentation tests, diagram generation checks, targeted TypeScript, and diff checks. Do not run the full mate suite. Finish with a refreshable localhost loop.
