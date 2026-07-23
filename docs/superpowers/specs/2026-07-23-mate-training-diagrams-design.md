# Mate Training Diagrams

## Goal

Make the least intuitive geometry in the Queen, Rook, and Two Bishops
instructions easier to recognize and remember. The diagrams must explain the
same concepts as the evaluator and its human-facing priorities; they must not
introduce alternate rules.

## Approach

Use the existing accessible `MateRuleNoteBoard` renderer to add compact static
examples to each mating set's Notes section. Static examples keep the numbered
priority list readable, work on narrow screens, and avoid adding controls to a
reference modal.

Rejected alternatives:

- Placing diagrams between priorities would visually fragment the evaluator
  order.
- Interactive before/after boards would add state and controls before static
  examples have proved insufficient.

## Diagrams

### Queen: box geometry

Show a Queen whose rank and file form the near sides of the board-edge
rectangle containing Black's king. Highlight the complete contained rectangle.
The caption identifies its shorter and longer side lengths and says to minimize
the shorter side first.

### Rook: phase 2 box

Show the Rook's file strictly between the kings. Highlight Black's side of the
Rook wall. The caption explains that this is a phase 2 box. This mirrors the
phase classifier rather than illustrating a merely similar-looking position.

### Two Bishops: wall and corner

Show two adjacent bishops with the forward diagonals they control highlighted.
The caption explains that adjacent bishops make one wall and reduce Black's
room.

Show the corner finish separately: Black in the corner, White's king on a
knight-move support square, and the adjacent bishops covering the last escapes.
The caption explains the division of work between king support and the bishop
wall.

## Presentation

Extend the note-board highlight vocabulary with semantic `box`, `wall`, and
`support` kinds. Preserve the current dark/warm/pink house style and existing
board sizing. Captions remain one short sentence each. The board's generated
accessible label names every piece and highlighted square.

Queen and Rook each receive one board. Two Bishops receives two boards because
the traveling wall and corner finish are distinct ideas.

## Testing

- Assert each mating set exposes the expected board IDs, pieces, highlights,
  and captions through the registered immutable rule-set facade.
- Render each guide and assert the new titles, accessible labels, and semantic
  highlight markers are present.
- Run the focused Mate test suite, lint, and production build.
- Perform a targeted visual check of only the three affected guide modals at
  desktop and narrow widths.

No mating evaluator, move selection, phase classification, or proof data
changes are in scope.
