# Two Bishops Ignore-Light-Bishop Degenerate Design

## Goal

Add a Phase 2 degenerate repair for the supplied position. In the canonical orientation, Black's king is on g8, White's king is on f6, and the dark-squared bishop is on g7. The light-squared bishop's location is irrelevant. White must play Bh6.

## Matcher

Match the exact king and dark-bishop stencil under all eight D4 rotations and reflections. Do not allow translations. Identify the required bishop by its exact transformed g7 square; the other bishop may occupy any legal square. Require the transformed g7–h6 move to be legal on the current board.

The repair is terminal and uniquely selects the transformed Bh6 move. Its specific reason label is `degenerate — ignore light-squared bishop`.

## Presentation

Add a diagram using the supplied position and an arrow from g7 to h6. The caption states that the light-squared bishop's location is irrelevant and the dark-squared bishop moves to h6. Place it immediately after phase 2 opposition and before the broader mate-in-four matcher. Keep diagram order identical to degenerate priority order.

## Verification

- Select Bh6 uniquely in the supplied position under every D4 transform.
- Move the light-squared bishop to multiple legal squares and preserve the same repair.
- Reject translations and changes to either king or the g7 dark bishop.
- Preserve universal legality, safety, symmetry, and rendered/mechanical alignment.
