# Major-Piece Phase Diagrams Design

## Goal

Make the Queen phase badge and the Queen and Rook training diagrams teach the
same concrete board patterns as their evaluators.

## Queen Phase

Queen phase 2 exists exactly when the current position has a stable two-square
corner cage. The broader condition that the Queen's rank or file lies between
the kings no longer defines Queen phase 2.

The existing two-square-cage geometry is the single classifier used by the
phase badge. The definition remains symmetric under every rotation and
reflection.

## Training Diagrams

Queen training info gains one full 8×8 board:

- title: `phase 2: corner cage`;
- Black king on `a8`;
- White Queen on `d7`;
- White King on `a6`;
- no caption, arrows, or highlighted squares.

Rook training info keeps its existing full 8×8 board and pieces, but:

- title changes to `phase 2: box`;
- the prose phase note is removed.

For both Queen and Rook, the board card is self-contained. The modal renders no
`Notes` heading and no bullet list around a board-only section. Other mating
sets retain their current notes presentation.

## Verification

- Prove that a stable two-square Queen corner cage is phase 2.
- Prove that the former rank/file-channel-only Queen position is phase 1.
- Preserve Queen phase symmetry under all eight board transformations.
- Assert both diagram titles, full-board layouts, pieces, and the absence of
  captions, highlights, the `Notes` heading, and phase-note bullets.
- Run the focused geometry, major-piece, and presentation tests, TypeScript,
  and diff checks.
