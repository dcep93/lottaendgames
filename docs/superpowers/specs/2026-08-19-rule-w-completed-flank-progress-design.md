# Rule W Completed-Flank Progress Design

## Problem

In the Phase 1 position `8/8/6k1/8/5K2/8/4BB2/8 w - - 0 1`, both bishops already control Rule W's flank diagonals. The evaluator nevertheless filters out every king move, then `bishop distance` alternates `Bf3` and `Be2` as Black alternates `Kh6` and `Kg6`. This returns to the exact starting position.

## Considered approaches

1. Change `bishop distance`. This would affect every position and weaken its rendered meaning.
2. Add history-aware reversal suppression. This would conflict with the app's deliberate preference for exposing loops by returning to the previous position.
3. Preserve an already-complete Rule W pair while allowing White's king to advance. This is the narrowest change and is selected.

## Design

Rule W continues to calculate ordinary candidate geometry after White's move while its flank pair is incomplete. When the starting position already has both bishops on a valid flank pair, a White king move also receives full Rule W credit when the unmoved bishops preserve that completed pair. Bishop moves must continue to satisfy the ordinary post-move Rule W geometry.

The rendered Rule W text does not change.

## Verification

- Add a regression proving the four-ply `Bf3 Kh6 Be2 Kg6` loop is no longer selected at its first White turn.
- Prove Rule W gives suitable king moves full credit from that position.
- Retain existing Rule W transformation, screening, partial-credit, and eligibility tests.
- Run the Two Bishops suite, then find a new Phase 1 loop and inspect every White decision before sharing it.

## Assumption

"Use bishops to control the flank diagonals" permits White's king to advance after the bishop structure is already complete, provided the bishops remain on that established pair.
