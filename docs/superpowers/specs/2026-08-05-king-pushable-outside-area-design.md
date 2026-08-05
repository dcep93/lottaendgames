# King Pushable Outside-Area Design

## Goal

Refine the Phase 1 priority to read:

> **king pushable** — Phase 1: Bring White's king toward the restricted-area diagonal while keeping it outside Black's restricted area.

For `8/8/8/8/6k1/3K4/2BB4/8 w - - 2 2`, this must reject `Ke2` and allow the later `king closer` priority to select `Kd4`.

## Cause

The bishops on `c2` and `d2` geometrically bound Black's area, but White's king on `d3` screens a bishop ray. The current implementation therefore treats the source confinement as absent, gives every move a `kingPushableDistance` of `99`, and lets `king closer` choose the inside-area move `Ke2`.

## Behavior

- Detect the smallest geometric confinement formed by the source bishops and Black's king even when White's king currently screens it.
- Keep those source diagonals fixed while comparing moves, so a bishop move cannot improve the score by moving the target.
- First prefer resulting White-king squares outside Black's open half-plane. A square on either boundary diagonal counts as outside.
- Then minimize squared Euclidean distance to the nearer source boundary diagonal.
- Let `king closer` break remaining ties.
- Keep the rule Phase 1-only and neutral when the source bishops form no geometric confinement.

In the supplied position, `Ke2` is one square from a boundary but lies inside Black's half-plane. `Kd4` and `Kc3` are both outside and one square from a boundary; `king closer` then prefers `Kd4`.

## Implementation

Retain the Black-side direction on each `BishopConfinement`. Build a shared source `king pushable` target from every smallest-area confinement without applying the White-screening exclusion used by `restricted area`. Add a move-score penalty for whether the resulting White king lies in any selected Black half-plane. Compare that penalty before the existing boundary-distance score.

## Verification

- Assert `Kd4` is uniquely ideal in the supplied position and `Ke2` is explained by `king pushable`.
- Assert the outside penalty and boundary distances for `Kd4`, `Kc3`, and `Ke2`.
- Assert the result under every D4 board symmetry.
- Preserve the prior on-boundary loop fixture and Phase 2 inactivity.
- Run TypeScript, oxlint, diagram freshness, and the combined Two Bishops/presentation suite.

## Assumptions

“Black's area” is the open board half-plane beyond the adjacent bishop diagonals on the side containing Black's king. Boundary squares are not inside that area. If equally small confinements exist in both diagonal orientations, White must remain outside every selected Black half-plane.
