# Restore Two Bishops Mating Position for Mate in Three

## Goal

Restore the previously taught mating-position geometry for the Two Bishops `mate in 3` rule and diagram without changing `sequester`.

## Geometry

In the displayed orientation with Black's king on `h8`, White's king mating squares are `f8` and `f7`. The full D4 orbit also gives `h6` and `g6` for the reflected orientation, and equivalent four-square sets for every corner.

Expose this geometry through the dedicated mating-position helper so the rule and presentation share one definition.

## Rule Behavior

- For both the corner mate-in-three pattern and its existing mate-in-two continuation, replace the current `isKnightMove` activation with membership in the relevant corner's mating-position squares.
- Keep the existing mate-pattern recognition and visible `mate in 3` ownership unchanged.
- Render: **mate in 3** — Phase 2: With Black's king in the corner and White's king in a mating position, play mate in 3.
- Do not alter `sequester`: its three subpriorities, corner-knight distance, activation, and rendered wording remain unchanged.

## Presentation

Restore a `mating position` note board with Black's king on `h8`, White bishops on `d4` and `c2`, no White king, and `f8` plus `f7` highlighted.

## Verification

- Test the canonical mating squares and their D4 transforms.
- Test that the corner mate-in-three pattern accepts mating position and no longer uses the broader knight-move condition.
- Preserve the mate-in-two continuation regression.
- Verify the exact diagram contents and rendered copy.
- Assert the current sequester wording and corner-knight score behavior are unchanged.
- Run focused Two Bishops tests, affected presentation tests, diagram validation, TypeScript, and diff checks.
- Run the fail-first Two Bishops loop gate and validate one refreshable localhost loop.

## Non-goals

- No change to `sequester`.
- No generalized target architecture.
- No full mate suite, exhaustive search, commit, push, or deployment.
