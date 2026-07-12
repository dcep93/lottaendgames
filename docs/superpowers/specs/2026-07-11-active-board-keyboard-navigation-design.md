# Active Board Keyboard Navigation Design

## Goal

Chapter 5 already renders parsed moves as clickable board updates. This change adds a single promoted active board, keyboard navigation within that board, branch-aware forward/back behavior, and an active panel tint.

## Scope

- Only one board is active at a time.
- Clicking a move promotes that move's position board to active and renders that move.
- Clicking a playable position number promotes that board to active and resets it to the initial position.
- Left and right arrow keys navigate only inside the active board. They do not continue into the next board.
- If the active board is absent from the viewport when an arrow key is pressed, the first visible playable board becomes active for that keypress.
- The active board panel receives a visible tint.

## Navigation Model

Build a per-position move graph from the existing parsed playback tokens. Each playable move token becomes a node with:

- the token id, display text, FEN, SAN, and path;
- a previous pointer to the nearest prior node in its parsed line, or the initial position;
- a default next pointer based on the chapter's textual order and parser-resolved main continuation;
- enough branch identity to remember a user's branch choice.

The initial position is treated as a cursor state, not as a move token. From the initial cursor state, `ArrowRight` chooses the position's main first move.

## User Interaction

Move click:

- promotes the move's board to active;
- renders the clicked token FEN;
- stores that token as the current cursor;
- remembers the clicked line as the preferred branch when applicable.

Position-number click:

- promotes the board to active;
- resets the board to its initial FEN;
- sets the cursor to the initial state;
- sets the preferred forward continuation to the main line.

Keyboard:

- `ArrowRight` advances from the current cursor to the preferred next move.
- `ArrowLeft` moves to the previous cursor state, or to the initial state from the first move.
- If the user enters a hypothetical branch, then moves backward to a shared main-line node, `ArrowRight` returns to the hypothetical branch rather than switching to the main continuation.
- If there is no preferred continuation for the current cursor, `ArrowRight` uses the default next pointer.
- If no active board is visible, the first visible playable board is promoted and receives the keypress.
- If the active board has no previous or next state for the requested direction, the keypress has no effect.

## Active Board Styling

The active board's full position panel gets a tinted treatment that fits the existing brown/pink/comic styling. The tint should be visible but restrained: a subtle background wash and/or border change on `.leg-position-card` is enough. Non-active boards keep the current styling.

## Architecture

Keep the existing JSON shape unchanged. Extend the parser output with a navigation structure rather than adding data to `chapter_5.json`.

Recommended pieces:

- `moveParser.ts` continues to parse text tokens and legal FENs.
- A focused playback/navigation helper derives per-position navigation nodes from the parsed tokens.
- `ChapterViewer.tsx` owns the active position id and per-position board states.
- Board rendering stays in `ChessBoard.tsx`; it receives only FEN, markers, and animation intent.

The existing `isOneMoveFenTransition` helper should continue to decide whether a board transition can animate.

## Edge Cases

- Boards without parsed playback are not promoted by keyboard fallback.
- Clicking a move in prose works the same as clicking a move in a moves section.
- Branch memory is per board. Changing to another active board does not erase the previous board's cursor state.
- Resetting a board through its position number clears that board's preferred branch back to main-line forward navigation.
- Arrow keys should avoid interfering with text input controls if any are added later.

## Testing

Add focused tests for the navigation helper:

- initial position + forward chooses the main first move;
- first move + backward returns to initial;
- clicking a branch move, backing up to a shared node, and going forward returns to that branch;
- direct jump to a later move does not force animation unless the FEN is one legal move away;
- reset clears branch preference.

Verify in the browser:

- clicking a position number tints that board and resets it;
- clicking a move tints only that board;
- right and left arrows update the active board only;
- no-visible-active-board fallback promotes the first visible playable board;
- active tint is visible in the existing visual style.
