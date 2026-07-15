# In-Page Board Expansion Design

## Goal

Replace native browser fullscreen for chessboards with an in-page expanded
view. The expanded board must occupy the available browser viewport without
removing browser chrome or putting the application into native fullscreen.

This design supersedes only the native-fullscreen behavior described in
`2026-07-15-reader-front-matter-and-board-controls-design.md`. All other board
and reader behavior remains unchanged.

## Interaction

- Clicking a board in its normal card toggles that board into an expanded view.
- The expanded wrapper covers the application viewport using a fixed overlay.
- The square board grows to the largest size that fits within both the viewport
  width and viewport height, so no rank, file, coordinate, or piece is cropped.
- Clicking the expanded board restores it to its original card position.
- Pressing `Escape` while a board is expanded also restores it.
- Expanding a board does not call `requestFullscreen`, `exitFullscreen`, or any
  other native Fullscreen API.
- The page behind the expanded board cannot scroll until the board is restored.

## Component Behavior

`ChessBoard` owns a boolean expanded state for its existing board instance. It
uses the same state transition for pointer activation, Enter/Space activation,
and Escape restoration. An Escape key listener exists only while the board is
expanded and is removed when the board is restored or unmounted.

While expanded, `ChessBoard` adds a board-expansion scroll-lock class to the
document body. Effect cleanup always removes that class so route changes and
component unmounting cannot leave the reader locked.

The board wrapper receives an expanded modifier class and an appropriate state
attribute. The interactive label and title use “Expand” in the normal state and
“Restore” in the expanded state; they must not describe the behavior as native
fullscreen.

The existing board instance, FEN, orientation, coordinates, markers, and move
animation state are preserved during expansion.

## Presentation

The expanded wrapper uses `position: fixed` with all four viewport edges set to
zero and a stacking level above the reader. It centers the board on an opaque
reader-theme background. The interactive board container is sized to the
smaller of the available viewport width and height, preserving the board's
square aspect ratio while maximizing its useful size.

The CSS uses `100vw` and `100vh` as fallbacks, followed by `100dvw` and `100dvh`
for browsers that support dynamic viewport units. Focus outlines remain visible
in both normal and expanded states.

## Accessibility and Keyboard Behavior

- The board remains keyboard-operable through its existing button semantics.
- Enter and Space toggle expansion.
- Escape restores an expanded board.
- The accessible label reflects whether activation will expand or restore the
  board.
- Focus remains on the same interactive board element across the transition.

## Testing

Focused tests will verify:

- normal and expanded labels;
- click/keyboard expansion and restoration state changes;
- Escape restoration;
- the absence of native Fullscreen API calls;
- expanded modifier markup and CSS;
- preservation of the existing FEN, orientation, coordinates, and board
  controls.

The full application test, lint, and production-build checks must continue to
pass. A live browser check will confirm that the overlay fills the browser
viewport, the board remains fully visible, Escape restores the card, and the
browser does not enter native fullscreen.
