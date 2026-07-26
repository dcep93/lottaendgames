# Queen cage minimum area

## Goal

Keep the Queen `corner cage` description and selector mechanically aligned:

> **corner cage** — Confine Black in the narrowest queen-to-corner box: shorter
> side first, then longer side. The box must have at least 2 squares.

## Selection

Measure the existing queen-to-corner rectangle without changing its dimensions.
Its area is the shorter side multiplied by the longer side. Within `corner
cage`, reject a candidate whose box area is less than two before comparing
eligible boxes by shorter side and then longer side.

The universal `mate`, `pieces safe`, and `no stalemate` priorities remain
higher. Therefore an immediate checkmate is still selected even when its final
geometry occupies one square.

Do not clamp a one-square box to invented dimensions or add a hidden selector.
Expose the minimum-area comparison as part of the existing visible `corner
cage` rule.

## Verification

Assert the exact displayed wording, score the minimum-area predicate directly,
and verify that eligible cages retain shorter-side/longer-side ordering. Run
the focused Queen and presentation tests, followed by the complete Mate suite.
