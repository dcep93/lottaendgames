# Remove Mate Guide Legend Design

## Goal

Remove the move-log Legend from every mating-pattern training-info modal.

## Design

Delete the shared Legend content and markup from `MatePriorityGuideDialog`
rather than hiding it with CSS or configuring individual mating patterns.
Queen, Rook, Two Bishops, Bishop and Knight, and Two Knights vs Pawn will
therefore remain consistent automatically.

Keyboard shortcuts remain as the final modal section. Remove the footer grid
that existed only to place shortcuts beside the Legend and render shortcuts as
a normal guide section.

This change does not alter the move-log columns, accessibility labels, or rule
content.

## Verification

- Assert that every mating-pattern guide contains Keyboard shortcuts.
- Assert that no guide contains the Legend heading or either Legend
  explanation.
- Run the complete Mate presentation test file and TypeScript.
