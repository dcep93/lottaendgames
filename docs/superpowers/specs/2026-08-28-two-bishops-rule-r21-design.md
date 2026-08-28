# Two Bishops Rule r21 Design

## Goal

Add rule r21: prefer the White king further from the bishops.

## Design

Rule r21 is ordered after r20. For each resulting position, sum the White
king's Chebyshev king-step distance from both bishops and prefer the larger
sum. This preserves the repository's established scoring convention for the
same White-king-to-bishops geometry and is invariant under rotations and
reflections.

The rule is neutral unless the position contains the White king and exactly
two White bishops.

## Verification

Add a focused comparison in which all earlier rules tie and r21 prefers the
larger total distance. Repeat under every board symmetry, run the focused Two
Bishops suite, then run the cached exhaustive early-exit loop search.

