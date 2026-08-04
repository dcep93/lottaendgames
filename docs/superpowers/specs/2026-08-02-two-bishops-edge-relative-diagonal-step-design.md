# Two Bishops Edge-Relative Diagonal Step

## Problem

The Diagonal king step matcher currently applies D4 transforms around White's king. That preserves relative piece offsets but also translates the canonical geometry around the board. It therefore accepts positions where the light-squared bishop does not control the relevant edge-relative diagonal.

## Correction

Define the canonical position by absolute board squares:

- Black king: `h6`
- White king: `f5`
- dark-squared bishop: `f6`
- light-squared bishop: any square on `e8–h5`
- repair: `Kf5–e6`

Recognize only the eight board-wide D4 rotations and reflections of those squares. Do not permit translations. The position `8/5K2/5B1k/5B2/8/8/8/8 w - - 0 1` must not satisfy Diagonal king step.

## Scope

This changes only the activation boundary of the existing Degenerate subtype. Its label, diagram, rule order, and repair move remain unchanged.

## Verification

- Preserve all four canonical diagonal placements.
- Preserve all eight board-wide D4 transforms.
- Reject the supplied translated position.
- Confirm its reason is no longer `degenerate — diagonal king step`.
- Run focused Degenerate tests, targeted TypeScript and diff checks, then the fail-fast Two Bishops gate and return a validated localhost loop.

