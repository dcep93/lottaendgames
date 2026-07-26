# Larger Move-Log Type Design

## Goal

Make every piece of text inside the move-log table easier to read without
making the table unnecessarily wider or increasing its padding.

## Typography

- Increase the table's inherited body size from `0.76rem` to `0.9rem`.
- Increase column-header text from `0.68rem` to `0.82rem`.
- Make buttons inside the table inherit the table's `0.9rem` size instead of
  the smaller shared Mate-button size.
- Keep the standalone correctness marks at `1.75rem`.

This covers move numbers, phases, moves, duration, reason labels, choice
counts, reply counts, and the visually hidden column headings. Existing
weights, line height, padding, column proportions, truncation, and horizontal
scrolling remain unchanged.

## Verification

- Assert the body, header, and table-button font sizes in CSS.
- Preserve the enlarged correctness-mark size.
- Run the focused presentation tests, TypeScript, and diff checks.
- Inspect the rendered move log at desktop and narrow widths.
