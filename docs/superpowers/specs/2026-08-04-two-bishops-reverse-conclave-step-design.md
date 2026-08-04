# Two Bishops Reverse Conclave Step Design

## Goal

Add a Phase 1 `reverse conclave step` priority immediately after
`conclave step`. It recognizes the supplied four-piece arrangement and every
legal translation, rotation, and reflection, then selects the corresponding
White king step.

## Canonical Geometry

The canonical position is
`8/6k1/8/5K2/4BB2/8/8/8 w - - 0 1`:

- White king: `f5`.
- Black king: `g7`, offset `(+1,+2)` from White's king.
- White bishops: `e4` and `f4`, offset `(-1,-1)` and `(0,-1)`.
- Required move: `Ke6`, offset `(-1,+1)` from White's king.

The matcher uses the same D4-relative coordinate machinery as `conclave step`.
Relative offsets make translation intrinsic; the eight D4 transforms provide
rotation and reflection. Positions or targets that fall outside the board do
not match.

## Rule Behavior

Add a `reverseConclaveStepPenalty` score field. It is zero only when the legal
candidate is the matching White king move from the current king square to the
transformed target; otherwise it is one.

Add the visible `reverse conclave step` rule immediately after `conclave step`
and before `finish wall`. The rule applies only when the starting position is
Phase 1. Its help text is:

> Phase 1: When the pieces are in the position shown, make the reverse conclave
> step.

No Phase 2 scoring, phase classification, Black policy, or existing conclave
geometry changes.

## Diagram

Extend the generated Two Bishops diagram positions with the exact canonical
FEN. The diagram is a full eight-by-eight board containing all four pieces and
an arrow from `f5` to `e6`. Add it to the guide immediately after the existing
`conclave step` diagram with title `reverse conclave step`.

## Verification

Tests must prove:

- `Ke6` is selected and explained by `reverse conclave step` in the canonical
  position;
- all D4 transforms select the transformed king step;
- at least one translated arrangement selects its translated king step;
- nearby arrangements and Phase 2 positions do not activate the rule;
- the visible rule order places it immediately after `conclave step`;
- the generated diagram preserves the exact FEN, full-board layout, four
  pieces, and `f5` to `e6` arrow;
- diagram generation, focused rule and presentation tests, TypeScript, and
  diff checks pass.

After verification, run the Phase 1 loop search with entering Phase 2 treated
as successful termination and provide a working local replay link.
