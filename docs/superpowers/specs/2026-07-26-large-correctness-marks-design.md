# Large Correctness Marks Design

## Goal

Make the move log's standalone correctness marks immediately legible without
enlarging the choice buttons or table rows.

## Design

Keep the existing text glyphs and accessible labels:

- `✓` for a correct move;
- `×` for an incorrect move.

Render both marks at `1.75rem`, with `line-height: 1` and a fixed centered width
of `1em`. The shared styling keeps the two different glyph shapes visually
aligned. Colors, backgrounds, adjacent choice buttons, and table spacing remain
unchanged.

## Verification

- Assert the enlarged font size, fixed width, and centered alignment in CSS.
- Preserve the rendered `Correct` and `Incorrect` accessible labels.
- Run the focused presentation tests, TypeScript, and diff checks.
- Inspect a move-log example containing both marks.
