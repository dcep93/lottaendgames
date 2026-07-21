# Mate Board Focus Release

## Goal

Keep Mate keyboard shortcuts available after a pointer user clicks a piece,
clicks a destination square, or drags and drops a piece. Board interaction must
not leave a focused internal chessboard element that intercepts the arrow keys.

## Interaction

`MateBoardSurface` owns a reference to the board shell. After each piece click,
square click, and piece drop callback, it checks `document.activeElement`. If the
focused element is inside that board shell and supports `blur()`, the board
blurs it. The move and selection behavior remains unchanged.

Focus outside the board is untouched. The existing shortcut exclusions for
buttons, links, and form controls remain unchanged, so keyboard-focused controls
retain their accessible behavior. Missing browser globals, detached nodes, and
non-blurrable active elements are harmless no-ops.

## Structure

A small pure defensive helper performs the containment and blur checks. The
board component calls it through one local function, keeping DOM focus concerns
separate from chess move resolution. The helper is exported only for focused
unit coverage.

## Verification

Tests cover a focused board descendant, focus outside the board, absent DOM
state, containment errors, and elements without `blur()`. Presentation tests
verify that piece clicks, square clicks, and drops all invoke focus release while
preserving their existing selection and move results. Run the focused Mate board
tests, lint, and the production build.
