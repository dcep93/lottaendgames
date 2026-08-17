# Two Bishops Edge Flank Diagonal-Move Design

## Scope

Narrow `edge flank` so it recognizes the movement described by its existing rendered text. Do not change the rule text, priority, diagram, or derived flank-target geometry.

## Scoring

`edge flank` continues to apply in both phases whenever Black's king is on an edge. A candidate receives full credit only when all of the following are true after White's move:

- White moved the king.
- The king moved one file and one rank: a diagonal king step.
- The destination is one of the flank targets derived from Black's edge square.

Lateral or vertical king moves do not receive credit even if their destination is a flank target. Bishop moves do not preserve or earn credit merely because White's king already occupies a flank target.

For `8/8/8/8/4B3/3KB3/8/3k4 w - - 50 26`, `Kc3` is lateral from d3 to c3, so it does not satisfy `edge flank`.

## Verification

- Add the supplied Phase 2 `Kc3` regression.
- Preserve the existing diagonal Phase 1 and Phase 2 examples.
- Verify rotations and reflections still recognize diagonal king steps.
- Run the focused rules and presentation tests, lint, build, and diagram consistency check.
- Find and open a strict Phase 1 loop, treating entry into Phase 2 as termination.
