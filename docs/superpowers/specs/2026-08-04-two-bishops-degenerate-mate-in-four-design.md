# Two Bishops Degenerate Mate-in-Four Design

## Goal

Add a direct, human-visible `degenerate — mate in 4` pattern that recommends only `Kc7` in `8/k7/2KB4/8/2B5/8/8/8 w - - 2 2`.

## Activation

Use the exact board-anchored geometry:

- Black king on `a7`;
- White king on `c6`; and
- either White bishop has a clear line controlling `a6`.

Apply all D4 rotations and reflections. Do not allow translations. The other bishop may occupy any legal square.

## Selection

- Recommend only the legal king move `Kc7`, or its D4 equivalent.
- Implement this as a direct pattern match, with no mate search or proof-distance lookup.
- Register it first in the degenerate priority order so this exact mating pattern owns any overlap with repair patterns.

## Presentation

Add a matching degenerate diagram using the supplied position, highlight `a6`, and draw the `c6-c7` arrow. Caption it as the mate-in-four pattern rather than exposing search details.

## Verification

- The supplied position uniquely recommends `Kc7` with the refined reason `degenerate — mate in 4`.
- All eight D4 transforms recommend the corresponding king move.
- Translations and king/control near misses do not activate.
- The controlling bishop may occupy different legal squares while retaining clear control of `a6`.
- Run focused Two Bishops rules, directly affected presentation tests, TypeScript, diagram generation/checks, diff checks, and an all-Phase-2 fail-fast loop scan.

## Non-goals

- No generic mate-in-four solver, translation support, or change to the existing `mate in 3` rule.
