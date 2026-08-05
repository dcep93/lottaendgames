# Two Bishops Corner-Diagonals Diagonal-Control Design

## Goal

Clarify and enforce the existing `degenerate — corner diagonals` postcondition. Merely attacking the endpoint `h5` from another diagonal is insufficient.

## Copy

> Preserve one bishop's control of f8 and the other's control of d1 h5 diagonal, or tighten the h5 cutoff by controlling h6. The cutoff still identifies h8 after Black steps around the corner.

## Mechanic

Under each D4 transform, the two accepted postconditions are:

1. One bishop preserves clear control of `f8`, while the other bishop occupies the `d1–h5` diagonal: `d1`, `e2`, `f3`, `g4`, or `h5`.
2. The existing cutoff-tightening alternative controls both `h5` and `h6`.

The selector remains stateless, non-translating, and D4-symmetric. In `8/3BB2k/5K2/8/8/8/8/8 w - - 0 1`, `Be8` is rejected because `e8` attacks `h5` but does not occupy the `d1–h5` diagonal.

## Scope

- Replace the diagram caption with the supplied wording.
- Tighten only the first corner-diagonals postcondition.
- Update focused selector and presentation assertions.
- Preserve target-corner calculation, diagram geometry, rule ordering, reason ID, and the existing `h6` alternative.

## Alternatives

- Requiring occupancy on the displayed diagonal is selected because it mechanically distinguishes diagonal control from attacking one endpoint.
- Continuing to accept any attack on `h5` is rejected because it incorrectly allows `Be8`.
- Hard-coding `Be8` as forbidden is rejected because it would be witness-shaped and fail D4 symmetry.

## Verification

Assert that the supplied `Be8` witness is rejected under every D4 transform while existing diagonal-occupancy and `h6` alternatives remain accepted. Run the targeted corner-diagonals and presentation tests, TypeScript, and `git diff --check`, then load the next all-Phase-2 loop.

## Assumption

“Control of d1 h5 diagonal” means the bishop physically occupies that diagonal. The copy is rendered exactly as supplied, without punctuation between the square names.
