# Two Bishops Rule R: Manhattan King Distance

## Goal

Keep rule R in its current priority position but measure king proximity with Manhattan distance.

## Behavior

Evaluate the resulting position after White's move. Rule R scores the kings with `|white file - black file| + |white rank - black rank|`; lower is better. Bishop moves retain White's current king square. Missing-king compatibility scores remain worst-case.

This replaces squared Euclidean distance only for rule R and its shared `kingCloserDistance` score. Other rules that explicitly use Euclidean or squared Euclidean distance remain unchanged.

## Verification

Add the reported regression after `Kd6 Ke3`: from Black's e3 king, `Ke6` has Manhattan distance 3 and `Kc5` has distance 4, so rule R must prefer `Ke6`. Run focused Two Bishops tests, the production build, and the development verifier. Then find and load an exact all-ideal loop at `cursor=0`, with Black nearest h1 when possible.
