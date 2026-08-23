# Rule WW Ideal Wall Placement Design

## Goal

Refine Rule WW so an outer-wall bishop is not merely off the board edge, but ideally sits one square from the edge and adjacent to the other wall bishop.

## Design

Rule WW continues to inspect only the smallest valid Rule O walls produced by a move. For each such wall, rank its outer bishop lexicographically:

1. Prefer off-edge over on-edge.
2. Among off-edge placements, prefer an edge distance of exactly one.
3. When those tie, prefer the two wall bishops to be adjacent by king distance.

If a move produces more than one equally small wall, use its best Rule WW wall. Rule order and all other wall validity requirements remain unchanged.

## Verification

- Update the rendered Rule WW text exactly as requested.
- Preserve the existing rejection of an outer bishop placed on the edge.
- Add focused tests for the one-square edge-distance and adjacency tie-breaks.
- Run the minimal-policy tests, lint, build, and a fast Two Bishops verifier.
- Validate and load a loop at `cursor=0`.
