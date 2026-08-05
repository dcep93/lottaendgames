# Two Bishops: Wall–King Adjacency

## Goal

Recognize a bishop wall that is diagonally adjacent to White's king while continuing to reject a wall that shares an edge with White's king. This makes the f8–f7 wall valid after Bg6+ in `4k3/7B/4K2B/8/8/8/8/8 w - - 2 2`, so its forced direction assigns a8 as the target corner.

## Wall eligibility

For each square in a candidate two-square wall:

- reject the wall if White's king occupies the square;
- reject the wall if White's king is orthogonally adjacent to the square;
- allow the wall if White's king is only diagonally adjacent.

Mechanically, each wall square must have Manhattan distance greater than one from White's king. This condition replaces the current Chebyshev-distance-greater-than-one condition in the shared wall detector, so wall recognition and target-direction calculation remain aligned.

## Target-corner explanation

Render the complete target-corner hierarchy:

> Target corner: Calculate after White's move. First, if a two-square bishop wall beside Black's king forces every legal Black reply along the edge in one direction, use the corner in that direction. A wall may be diagonally adjacent to White's king, but not occupied by or orthogonally adjacent to it. Otherwise, choose the corner White can reach before Black with the greatest lead. If White wins neither race, choose the corner closest to White's king. If corners remain tied, prefer the direction indicated by the nearest wall; retain both corners if still tied.

## Verification

Focused D4 tests will prove diagonal adjacency is accepted, orthogonal adjacency is rejected, and Bg6+ assigns the a8-equivalent corner. The directly affected rendered-note assertion, TypeScript, diagram check, and diff check form the proportional verification gate. The final handoff includes one refreshable cycle whose entire boundary remains in Phase 2.

