# Queen cage everywhere

## Goal

Measure the Queen cage in every legal Queen-mate position, not only after
Black's king reaches an edge.

## Geometry

The cage is the board-edge rectangle bounded by the Queen's rank and file and
the corner on Black's side of both boundaries. The rectangle must contain
Black's king.

Sort the two Queen-to-corner side lengths, then compare candidate moves
lexicographically:

1. minimize the shorter side;
2. minimize the longer side.

If the Queen shares a rank or file with Black, that axis is open rather than
confined and receives the existing sentinel length of eight.

## Selection

`corner cage` remains after mate, piece safety, and stalemate avoidance and
before `queen a knight's move away`. It therefore selects a safe cage shrink
before placement and king-proximity preferences.

Before comparing dimensions, the cage must leave Black at least two squares
that are not occupied or attacked by White.

For
`5Q2/8/8/8/1K6/8/2k5/8 w - - 0 1`, `Qf3` creates a `2 × 5` cage and must
defeat moves that leave the `5 × 7` cage unchanged.

The stable edge-segment helper may remain as independent geometry, but it may
not score production Queen moves.

## Verification

- Unit-test the rectangle orientation and shorter-side/longer-side ordering.
- Assert that `Qf3` is the sole production recommendation in the supplied
  position and that its reason is `corner cage`.
- Run focused Queen rule tests, lint, and the production build.
- Run the production Queen verifier with bounded resources. Report a loop or
  incomplete run honestly; do not add a concealed completion filter.
