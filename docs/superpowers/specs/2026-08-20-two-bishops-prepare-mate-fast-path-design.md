# Two Bishops Prepare Mate Fast Path Design

## Goal

Replace the generic mate-in-three search behind `prepare mate` with the rule's fixed three-stage bishop maneuver, and add a no-cache unique-mate fast path.

## Prepare Mate Maneuver

The maneuver has three role-preserving stages:

1. With Black in the corner, play a quiet setup that places one bishop on the secondary squeeze role while the other bishop remains able to deliver the eventual primary-line mate. Black has one legal king move out of the corner.
2. The secondary bishop checks Black back into the corner. The corner must be Black's only legal reply.
3. The other bishop checkmates from the matching primary role.

Recognize the roles through the actual legal move sequence: the stage-two check and stage-three mate must be made by different bishops, the stage-two check must force the associated corner, and the final bishop move must be checkmate. Inspect only quiet setup moves, bishop moves whose SAN is checking, forced king replies, and bishop moves whose SAN is mate. Do not explore arbitrary continuations.

The existing rendered `prepare mate` text and priority stay unchanged. Rotations and reflections follow from legal board geometry rather than hard-coded square lists.

## Unique Mate Fast Path

Before constructing the expensive Two Bishops strategic context, scan legal moves for immediate checkmates. When exactly one legal move mates, return scores that allow the first `mate` priority to select it without calculating any later rule. When zero or multiple immediate mates exist, retain the normal analysis so existing multi-mate tie-breaking is unchanged.

No position-result cache or memoization is permitted.

## Verification

Preserve the supplied `Bf6, Kg1, Bd4+, Kh1, Bf3#` maneuver and existing transformed prepare-mate regressions. Add role tests rejecting a same-bishop final mate or a check that does not force the corner. Benchmark all six supplied White positions before and after, assert identical ideal moves and reasons, run the focused Two Bishops tests, and load a verified loop at `cursor=0`.
