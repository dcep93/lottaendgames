# Chapter Selection Scroll Design

## Goal

Make chapter navigation predictable from both selectors. Selecting a different
book part must display that part from the top instead of retaining an unrelated
scroll offset from the previous part.

## Behavior

- The top Contents dropdown and compact bottom selector use the same chapter
  selection handler.
- When a different part is selected, the app resets chapter-specific playback,
  active-board, and revealed-solution state as it does today.
- The window then moves immediately to the top-left corner without smooth
  animation. Selecting the already-active part remains a no-op.
- Board-local scrolling, active-board navigation, and move playback are
  unchanged.

## Implementation

Add an immediate `window.scrollTo({ top: 0, left: 0, behavior: 'auto' })` to the
existing chapter selection path. Keeping this in the shared handler ensures the
top and bottom controls cannot drift into different behavior.

## Verification

- In a live browser, change parts from a nonzero scroll offset through the top
  dropdown and confirm `window.scrollY === 0`.
- Repeat through a bottom selector button.
- Check the behavior at desktop and narrow-phone widths.
- Run the unit, content, strict SAN, advisory SAN, lint, and production-build
  gates.
