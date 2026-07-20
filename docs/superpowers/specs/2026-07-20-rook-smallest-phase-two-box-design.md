# Rook smallest phase-two box design

## Goal

Select `Ra7` from `7k/8/R7/6K1/8/8/8/8 w - - 0 1` without changing the
approved `Kg5` selection from `8/7k/1R6/5K2/8/8/8/8 w - - 4 3`.

## Rule

Update the rendered priority to:

> **establish box** — Use the Rook to make the smallest phase 2 box without
> placing the rook adjacent to the White king.

The evaluator compares this priority in two stages:

1. prefer results that are phase 2 and do not place the Rook adjacent to
   White's King;
2. among those results, minimize the Rook box size.

No separate hidden shrink-box rule or position-specific exception is added.
The supplied `Ra7` position has one eligible size-1 result, so `Ra7` wins at
`establish box`. In the approved `Kg5` position, all eligible results have size
2, so the establish-box priority ties and the later `king closer` priority
continues to select `Kg5`.

## Verification

- Add the supplied position as an exact move, reason, score, and D4 symmetry
  fixture.
- Keep the `Kg5` fixture pinned.
- Run the focused Rook tests and the exhaustive identity-keyed verifier.
- Report one shortest directly replayable loop or 50-move witness if the
  exhaustive verifier fails.
- Run lint and the production build.
