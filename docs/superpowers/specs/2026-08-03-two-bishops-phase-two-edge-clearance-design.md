# Two Bishops: Phase 2 edge clearance

## Goal

Replace the middle-16 requirement with the geometry the trainer actually teaches: Black is forced to remain on an edge and White's king is not on or adjacent to that edge.

## Behavior

- On Black's turn, Phase 2 requires Black's king to be on an edge, every legal Black king move to remain on an edge, and White's king to be at least two squares inward from an edge containing Black's king.
- At a corner, either incident edge may establish the required clearance.
- On White's turn, Phase 2 retains the existing semantics: White has at least one legal move that creates the Black-to-move Phase 2 condition.
- The `force phase 2` selector compares moves by whether their resulting Black-to-move position satisfies this same classifier.

## Presentation

- `force phase 2` renders `(see notes)`.
- The note renders: `Phase 2: Black's king is forced to the edge, White's king is not adjacent to that edge.`

## Verification

Use focused Two Bishops rule and presentation tests, TypeScript, diagram consistency, diff checking, and the fail-fast loop runner. Do not perform browser validation.
