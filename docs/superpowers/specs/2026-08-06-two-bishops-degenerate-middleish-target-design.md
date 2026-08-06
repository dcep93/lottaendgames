# Two Bishops Degenerate Middleish Target

## Goal

Add a Phase 1 degenerate repair named `degenerate — middleish target` for the supplied position:

`8/8/8/1k1BK3/3B4/8/8/8 w - - 12 7`

The repair makes `Kd6` uniquely correct instead of allowing the general Rule W comparison to choose another move.

## Matching

Match the exact piece geometry in the supplied position under every rotation and reflection of the board. Do not match translations or nearby arrangements. The repair is inactive whenever the position is Phase 2.

Use the existing absolute D4 transform infrastructure. In canonical orientation the required squares are:

- Black king: b5
- White king: e5
- White bishops: d5 and d4
- White target: d6

The target move must also be legal in the candidate position.

## Priority and Presentation

Register the repair with the other Phase 1 degenerates before `degenerate — phase 1 loop escape`. Its visible reason is `degenerate — middleish target`.

Add a generated training diagram using the canonical position and an arrow from e5 to d6. The general visible priority remains `degenerate — repair degenerate positions`.

## Verification

- Assert that the supplied position is Phase 1 and uniquely selects `Kd6`.
- Assert the exact reason label and zero degenerate penalty.
- Assert the transformed move for all eight D4 symmetries.
- Assert rejection of a translation, nearby geometry, and a Phase 2 position.
- Include the canonical diagram in diagram-generation and presentation consistency checks.
- Run the Two Bishops rule tests, presentation tests, TypeScript build, lint, and diagram drift check.
