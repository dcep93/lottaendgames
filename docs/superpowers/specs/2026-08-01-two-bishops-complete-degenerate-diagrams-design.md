# Complete Two Bishops Degenerate Diagrams

## Goal

Give every distinct Two Bishops Degenerate selector family its own mechanically aligned teaching diagram.

## Missing Diagrams

Add two generated Phase 1 fixtures after the existing Degenerate note boards and before the proximate-wall board.

### King Sidestep

- Title: `degenerate — king sidestep`
- FEN: `8/8/8/4BB2/5K2/8/5k2/8 w - - 32 17`
- Arrow: `f4-g4`
- Caption: `Step White's king away from the offset bishop.`

### Reform Wall

- Title: `degenerate — reform wall`
- FEN: `8/8/8/4BB2/6K1/8/4k3/8 w - - 34 18`
- Arrow: `e5-f4`
- Caption: `Re-form the bishop wall with the arrowed move.`

## Coverage

The five Degenerate diagrams are edge repair, free bishop, waiting move, king sidestep, and reform wall. D4 and translated variants do not receive duplicate boards because each selector is already symmetric and position-relative.

The proximate-wall and Conclave diagrams remain separate non-Degenerate teaching boards, producing seven Two Bishops note boards in total.

## Verification

- Validate both new FENs are Phase 1.
- Assert each arrow is legal, uniquely selected by Degenerate, and matches the production selector.
- Assert the registered note-board IDs, pieces, arrows, captions, and order.
- Assert presentation renders all seven boards and both new titles/arrows.
- Run focused Degenerate, diagram-generator, presentation, TypeScript, and diff checks only.
- Reuse and verify a current localhost loop because policy is unchanged.

## Scope

No policy, score, phase, existing diagram, full mate suite, exhaustive validation, commit, archive synchronization, push, or deployment change.
