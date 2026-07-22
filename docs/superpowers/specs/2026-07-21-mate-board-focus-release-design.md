# Mate Board Focus Release

## Goal

Keep Mate keyboard shortcuts available after a pointer user clicks a piece,
clicks a destination square, or drags and drops a piece. Board interaction must
not leave a focused internal chessboard element that intercepts the arrow keys.

## Interaction

`MateBoardSurface` owns a reference to the board shell and tracks whether the
current interaction began with a pointer. When that pointer is released or
cancelled, it checks `document.activeElement`. If the focused element is inside
the board shell and supports `blur()`, the board blurs it. A completed drop also
performs the check so a release outside the shell is covered. The move and
selection behavior remains unchanged.

Focus outside the board is untouched. Keyboard-initiated board interactions do
not set the pointer marker, so their focus is preserved. The existing shortcut
exclusions for buttons, links, and form controls remain unchanged. Missing
browser globals, detached nodes, and non-blurrable active elements are harmless
no-ops.

## Structure

A small pure defensive helper performs the containment and blur checks. The
board component calls it through one local function, keeping DOM focus concerns
separate from chess move resolution. The helper is exported only for focused
unit coverage.

## Verification

Tests cover a focused board descendant, focus outside the board, absent DOM
state, containment errors, and elements without `blur()`. Presentation tests
verify pointer release and drag/drop focus release while preserving keyboard
focus and the existing move result. Run the focused Mate board tests, lint, and
the production build.
