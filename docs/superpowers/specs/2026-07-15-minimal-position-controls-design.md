# Minimal Position Controls Design

## Goal

Reduce each playable position's control row to exactly four controls, in this
order:

1. Lichess
2. Previous move (`←`)
3. Reset
4. Next move (`→`)

This design supersedes the move-status and keyboard-hint requirements in
`2026-07-15-reader-front-matter-and-board-controls-design.md`. It does not alter
move playback, branch selection, reset behavior, Lichess URLs, or keyboard move
navigation.

## Component Changes

`PositionControls` renders no current-move text, no `Start position` text, and
no `Keys: ← →` hint. The component no longer accepts a `currentMove` prop because
that value has no presentation responsibility after this change.

For a playable position with a Lichess URL, the component renders only the four
controls listed above. Previous and Next remain arrow-only buttons with their
existing accessible labels, titles, disabled states, and callbacks.

For a non-playable board with a Lichess URL, the component continues to render
only the Lichess control. If neither playback nor a Lichess URL applies, it
continues to render nothing.

## Styling

Remove the status and key-hint style rules. Preserve the existing compact
spacing, button treatments, focus treatments, and arrow-button sizing. Do not
add replacement status text elsewhere in the position card.

## Accessibility

Removing the visible status and hint also removes them from the accessibility
tree. Keyboard Left/Right navigation continues to work even though its visible
hint is gone. Previous and Next remain announced through `aria-label` and
`title` values rather than their arrow glyphs alone.

## Testing

Focused presentation tests must verify:

- exact `Lichess`, Previous, Reset, Next ordering;
- arrow-only Previous and Next button content;
- descriptive accessible labels for both arrow buttons;
- absence of `Start position`, current-move status, and `Keys: ← →` markup;
- Lichess-only behavior for non-playable boards.

The full application tests, lint checks, production build, and a live browser
inspection must pass after implementation.
