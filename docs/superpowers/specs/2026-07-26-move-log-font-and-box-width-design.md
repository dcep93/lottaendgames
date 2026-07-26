# Move-Log Font and Box Width Design

## Goal

Restore the move log's original app typography while keeping its outlined
numeric controls visually stable.

## Typography

Remove the Courier New stack from the table and set `font-family: inherit`.
This restores the app's established Space Grotesk stack without duplicating it
inside the Mate module.

Keep the recently enlarged body, header, and correctness-mark sizes.

## Numeric Boxes

The outlined number buttons in Correctness and Black replies receive an exact
width of `2.5rem` rather than a content-dependent minimum width. Their height,
padding, labels, disabled behavior, and click behavior remain unchanged.

Move, duration, and reason columns remain content-aware. Do not enable fixed
table layout or force every column to the same width.

## Verification

- Assert that the table inherits its font family and no longer names Courier.
- Assert an exact `2.5rem` width for numeric choice buttons.
- Preserve the larger table and correctness-mark typography.
- Run the focused presentation tests, TypeScript, and diff checks.
- Inspect a rendered row with Correctness and Black-reply controls.
