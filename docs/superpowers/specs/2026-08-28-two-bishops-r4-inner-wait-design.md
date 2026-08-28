# Two Bishops r4 Inner-Bishop Wait Design

## Goal

Make r4 choose `Bb5` from `k7/2KB4/3B4/8/8/8/8/8 w - - 4 3`, producing the
forced line `Bb5 Ka7 Bc5+ Ka8 Bc6#`.

## Design

At the r4 corner-wait stage, a bishop move must retain the exact adjacent
diagonal wall, avoid check and stalemate, preserve the wall after every Black
reply, and avoid leaving a bishop en prise.

The inner bishop may move to a square at equal or smaller squared Euclidean
distance from the target corner. The outer bishop must move strictly closer.
This admits valid equal-distance inner-bishop waits such as `Bb5` while still
rejecting the previously identified non-mating outer-bishop retreat.

## Verification

Require `Bb5` uniquely in the supplied position and verify its forced mate
under every board symmetry. Update the earlier corner-wait regression to accept
all valid inner-bishop waits that force mate in three. Run the focused suite and
the cached exhaustive early-exit loop search.

