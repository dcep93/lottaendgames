# Animate Clicked Move From Parent Design

## Goal

Move clicks should always animate the clicked SAN as though it were played from its own parent position in the parsed move tree. Position-number clicks should keep their snap-to-position reset behavior.

## Scope

- Clicking a position number promotes that board, resets it to the initial FEN, and does not animate.
- Clicking a move SAN promotes that board and animates from the move's parent FEN to the move's target FEN.
- The animation should not depend on the board's currently rendered FEN.
- Arrow-key navigation keeps the active-board behavior from the previous design.
- Branch preference behavior remains unchanged.

## Behavior

When a move SAN is clicked:

1. Find the clicked move's navigation node.
2. Resolve its parent FEN:
   - if the node has a previous move, use that previous node's FEN;
   - if it has no previous move, use the position's initial FEN.
3. Promote the board to active.
4. Render the parent FEN without animation.
5. On the next browser frame, render the clicked move's FEN with animation enabled.

This allows clicking any move in the book text, including a deep branch move, to show the move itself being played rather than snapping from the board's unrelated current state.

When a position number is clicked:

1. Promote that board to active.
2. Reset to the position's initial FEN.
3. Clear the active move cursor.
4. Keep animation disabled.

## Architecture

Keep `ChessBoard` simple. It should continue to receive only the FEN, markers, and whether the next update should animate.

Add a focused navigation helper instead of adding path math to `ChapterViewer`:

- `playbackNavigation.ts` should expose a function that returns the parent FEN for a node id, using the existing per-position navigation map.
- `ChapterViewer.tsx` should use that helper when handling move clicks.
- The move-click handler should update branch preferences and active board state in one place.

The existing `isOneMoveFenTransition` helper can still be useful for arrow-key moves, but direct SAN clicks should not use current-FEN adjacency as their animation gate. The parent-FEN staging guarantees the move is adjacent by construction.

## Error Handling

If a clicked token cannot be found in the navigation graph, fall back to the current snap behavior with animation disabled. That keeps the viewer usable if parser coverage is incomplete.

If the initial FEN is missing, also fall back to the target FEN with animation disabled.

## Testing

Add focused tests for parent-FEN lookup:

- the first move in position 5.1 uses the position's initial FEN as its parent;
- a later branch move uses its previous parsed node's FEN as its parent;
- unknown node ids return no parent FEN.

Browser verification:

- clicking a position number resets instantly and leaves animation disabled;
- clicking `5.Kd2` stages from its parent and then animates to `Kd2`;
- clicking `1.Kg5!` still animates from the initial FEN;
- arrow-key navigation still works after a direct move click.
