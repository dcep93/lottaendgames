# Phase 1 Degenerate Loop Escape Design

## Goal

Recognize the supplied Phase 1 loop position as degenerate and make `Bf3` the unique repair before the general `king closer` rule can return to the king shuttle.

## Canonical Position

Starting FEN:

`B7/B7/8/1k6/3K4/8/8/8 w - - 16 9`

Repair: `Bf3`, moving the bishop from `a8` to `f3`.

## Pattern Scope

Match the canonical piece placement under all eight D4 board transforms: identity, rotations, and reflections. Do not match translations or nearby piece arrangements. The repair is Phase 1-only and must be legal in the matched position.

The visible refined reason is `degenerate — phase 1 loop escape`.

## Rule Integration

Add the pattern to the existing `degenerate` rule before the current Phase 1 degenerate patterns. Return an exact source and target move. The existing degenerate priority then selects the repair before `force phase 2`, cage rules, and `king closer`.

## Diagram

Add the exact canonical position to the generated Two Bishops diagram data with an `a8` to `f3` arrow. Add a guide board titled `degenerate — phase 1 loop escape` explaining that the bishop move breaks the king loop.

## Verification

- The canonical position is Phase 1 and uniquely selects `Bf3` with the refined degenerate reason.
- Every D4 transform selects the corresponding transformed move.
- A translated position and nearby geometry do not match.
- The generated diagram is Phase 1 and remains current.
- Focused Two Bishops, presentation, TypeScript, and lint checks pass.
- A fresh loop search treats entry into Phase 2 as termination.

## Boundaries

- Do not generalize the pattern to translations.
- Do not change `king closer` or other strategic scoring.
- Do not modify the main worktree.
