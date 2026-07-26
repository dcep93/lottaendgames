# Rook Smallest-Box Preservation Design

## Goal

Make `rook box` preserve the smallest box currently confining Black. Retaining
a weaker wall must not count as keeping the box when it gives Black more room.

## Behavior

- If a box exists, a move keeps it only when the resulting smallest box is no
  larger than the current smallest box.
- A smaller result shrinks the box; an equal result keeps it.
- A larger result enlarges the box even if it retains another existing wall.
- The attacked-rook distance preference applies only after box preservation.

For the position after `Rg6 Kh7` in the reported loop, the g-file wall confines
Black to a size-1 box. `Ra6` leaves only a size-2 box, while `Rg1` keeps the
size-1 box. `Rg1` must therefore outrank `Ra6`.

## Implementation

Replace the any-wall retention test with a direct comparison of the current and
resulting smallest box sizes. Keep the existing priority order: box preservation
before attacked-rook distance.

## Verification

- Add a regression test proving `Rg1` is the unique recommendation after
  `Rg6 Kh7`.
- Assert that `Rg1` has no keep-box penalty and `Ra6` does.
- Run the focused Rook rule and geometry tests.
- Run one low-priority exhaustive Rook verifier and report the next loop, if
  any, without automatically changing another rule.
