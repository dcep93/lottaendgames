# Two-row keyboard shortcuts

## Goal

Restore the keyboard shortcuts to two rows while retaining the compact horizontal spacing.

## Design

- Use a two-column grid with both columns sized to their content.
- Preserve the existing shortcut order, producing two shortcuts on each row.
- Keep each key-and-label pair content-sized.
- Do not restore the former stretching `1fr` columns.
- Keep the same two-row structure at narrow widths because the compact columns fit within the modal.

## Verification

- Update the CSS presentation assertion to require two `max-content` columns.
- Run the presentation tests and lint.
- Inspect the rendered row coordinates in the local modal.
