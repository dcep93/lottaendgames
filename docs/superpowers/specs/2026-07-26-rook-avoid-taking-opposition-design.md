# Rook king-closer opposition preference

## Goal

Teach and enforce the Rook technique of forcing opposition instead of voluntarily taking it.

## Visible rule

**king closer** — Prefer not taking opposition.

The title and position in the existing Rook priority list remain unchanged.

## Evaluator

Add a `kingOppositionPenalty` to the Rook score:

- `0` for a White king move whose resulting square does not put the kings in direct opposition;
- `1` for a White king move that takes direct opposition, or for a non-king move.

Compare this penalty first inside the existing `king closer` rule. Retain the current king-move proximity classification, king-move distance, and row-plus-file distance as later tie-breaks. The calculation depends only on the resulting board.

## Verification

- Assert the exact visible description.
- Add a focused legal position in which the current distance comparison prefers a move that takes opposition, while the new rule prefers a non-opposition alternative.
- Confirm all existing Rook fixtures and symmetry tests.
- Re-run the exhaustive symmetry-reduced Rook policy and require every state to retain a finite mate rank, ruling out repetition and fifty-move draws.
- Run lint and the production build.
