# Rook maximal-distance waiting move

## Goal

On White's third turn of the verified 50-move line, from
`8/8/8/8/2k5/1R6/2K5/8 w - - 4 3`, choose `Rh3` instead of `Rd3`.
All Rook waiting shapes should use the same memorable rule: make a quiet, safe
Rook move that keeps the strongest box boundary, then place the Rook as far
from Black as possible.

## Root cause

Direct king opposition activates the protected waiting branch. That branch
currently adds two preferences not stated in the training rules:

- the Rook must finish adjacent to White's King; and
- an accepted Rook move is ranked by distance from the board edge before its
  distance from Black.

`Rd3` satisfies the adjacency requirement and receives the preferred central
edge score. `Rh3` safely preserves the same rank box and is farther from Black,
but is rejected before the general distance comparison.

## Design

Use one eligibility test for every waiting shape. An accepted waiting move must:

- move the Rook without a capture or check;
- leave the Rook safe;
- preserve or shrink the current box; and
- retain a current strongest box boundary.

Do not require the Rook to finish adjacent to White's King. Remove the
protected-wait board-edge score. Among eligible waiting moves, compare only
Manhattan distance from the resulting Rook square to Black's King, preferring
the greatest distance. This is the same distance concept already rendered by
the later `rook farther` priority.

No displayed copy changes. The visible `waiting move` rule remains the reason
that rejects non-waiting moves; maximal distance is consistent with the visible
`rook farther` rule and no hidden position, orientation, or box-size exception
is introduced.

## Verification

- Add the supplied FEN as a focused fixture with sole ideal move `Rh3`.
- Assert `Rh3` is an eligible waiting move, maximizes Rook distance, and makes
  `Rd3` incorrect for the `waiting move` priority.
- Update deterministic snapshots only for policy changes caused by the general
  rule.
- Exhaustively enumerate symmetry-reduced and identity-keyed Rook graphs and
  require zero cycles.
- Rerun the exact verifier with the 50-move clock. If a failure remains, report
  its minimal bounded witness.
- Run the complete test suite, lint, and production build.
