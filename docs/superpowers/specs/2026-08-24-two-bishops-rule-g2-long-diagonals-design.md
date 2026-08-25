# Two Bishops Rule G2: Prefer Long Diagonals

## Goal

Before rule G4, prefer resulting positions with more bishops on long corner diagonals while the double-diagonal wall is not built.

## Behavior

Decide whether G2 applies from the position before White's move. If the starting bishops already form the geometric double-diagonal wall, G2 is inactive for every candidate. Otherwise, count the resulting bishops whose squares lie on either long corner diagonal, a1–h8 or a8–h1. Candidates with the greater count are preferred. Counting the resulting total, rather than only newly gained control, also rewards preserving an existing long-diagonal bishop.

G2 precedes G4, so establishing or preserving long-diagonal control is more important than keeping a long-diagonal bishop two king steps from a corner. G4 and the remaining active priorities break ties.

## Verification

Add focused coverage showing that a candidate with one resulting long-diagonal bishop beats a candidate with none when the reported c6/a3 starting position has no wall. Add coverage showing that G2 is inactive for all candidates when the starting geometric wall is already built. Run the focused Two Bishops tests, production build, and development verifier. Then find and load an exact all-ideal loop at `cursor=0`, oriented with Black nearest h1 when possible.
