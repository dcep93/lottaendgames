# Rule N Corner-Distance Gate

## Requirement

Rule N reads: “With a bishop wall and White's king controlling the escape square, shrink and check along the bishop wall, from at least 3 squares from the corner.”

## Design

For each starting bishop wall that otherwise supports a shrinking check, measure the checking bishop's destination from that wall's corner with Manhattan distance:

`abs(file difference) + abs(rank difference)`

The move qualifies for Rule N only when that distance is at least 3. The gate is associated with the same starting wall used to validate the tighter resulting wall; a move cannot borrow the distance of an unrelated wall orientation.

## Verification

- Reject `Bf1+` from the reported position because `f1` is Manhattan distance 2 from `h1`.
- Preserve the existing Rule N example at distance 3 or greater.
- Verify the threshold under rotations and reflections.
- Run focused Two Bishops tests, diagram validation, build, and the fast loop verifier.
- Replay and load a verifier-produced loop at `cursor=0`.
