# Two Bishops Phase 2 Opposition Degenerate

## Objective

Recognize the supplied Phase 2 position and select `Kf6` as the unique repair, so Black's forced `Kf8` reply leaves the kings in opposition.

## Position Family

- Reference FEN: `6k1/1B6/4K3/8/3B4/8/8/8 w - - 0 1`.
- The family includes the eight D4 rotations and reflections of the exact arrangement.
- The family does not translate and does not use move history.
- The position must be Phase 2 under the existing board-derived classifier.

## Rule Behavior

- Add the visible degenerate reason `degenerate — phase 2 opposition`.
- Place it first in the degenerate priority order because it identifies a concrete finishing arrangement.
- In the reference orientation, select only the legal king move `Kf6`; transform that move with the board orientation.
- Stop lower-priority rule comparisons after the repair, matching other unique terminal degenerates.

## Presentation

Add a diagram using the reference FEN with an arrow from `e6` to `f6` and the caption `Take opposition with the king.`

## Verification

- Assert the reference and every D4 transform are Phase 2.
- Assert the transformed `Kf6` equivalent is the only recommended move.
- Assert the visible reason is `degenerate — phase 2 opposition`.
- Assert an altered or translated arrangement does not match.
- Run the focused Two Bishops rule tests, affected presentation tests, diagram freshness check, TypeScript, and diff check.
- Run the existing fail-fast search until the next all-Phase-2 loop and load that refreshable URL in the sidebar browser.

## Assumptions

- `Kf6` is the requested move despite the current log marking it wrong.
- Rotations/reflections apply; translations do not.
- This is an exact degenerate repair, not a new general opposition selector.
