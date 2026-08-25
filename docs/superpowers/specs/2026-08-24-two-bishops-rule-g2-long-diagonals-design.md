# Two Bishops Rule G2: Prefer Long Diagonals

## Goal

Before rule G4, prefer resulting positions with more bishops on long corner diagonals while the double-diagonal wall is not built.

## Behavior

Evaluate G2 after White's move. If the resulting bishops form the geometric double-diagonal wall, G2 is inactive. Otherwise, count bishops whose square lies on either long corner diagonal, a1–h8 or a8–h1. Candidates with the greater count are preferred. Counting the resulting total, rather than only newly gained control, also rewards preserving an existing long-diagonal bishop.

G2 precedes G4, so establishing or preserving long-diagonal control is more important than keeping a long-diagonal bishop two king steps from a corner. G4 and the remaining active priorities break ties.

## Verification

Add focused coverage showing that a candidate with one long-diagonal bishop beats a candidate with none in the reported c6/a3 position. Add coverage showing that G2 is inactive once the geometric wall is built. Run the focused Two Bishops tests, production build, and development verifier. Then find and load an exact all-ideal loop at `cursor=0`, oriented with Black nearest h1 when possible.
