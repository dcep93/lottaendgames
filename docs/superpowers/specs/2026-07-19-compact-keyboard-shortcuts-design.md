# Compact keyboard shortcuts

## Goal

Remove excessive horizontal whitespace from the keyboard-shortcut section in the Mate training modal.

## Design

- Replace the stretching two-column shortcut grid with a wrapping flex row.
- Size each key-and-label pair to its content.
- Keep a small consistent gap between the key and label and between shortcut pairs.
- Let pairs wrap naturally on narrow screens without a shortcut-specific breakpoint override.
- Preserve shortcut order, wording, semantics, and keyboard behavior.

## Verification

- Add a presentation/CSS assertion for the compact flex layout.
- Run the presentation tests and lint.
- Inspect the modal at desktop and narrow widths in the local app.
