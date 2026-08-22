# Two Bishops King Stutter Design

## Goal

Add `king stutter` immediately before `king closer` in the Two Bishops white-move priorities.

Rendered rule text:

> **king stutter** — Do a king stutter step.

## Pattern

The canonical position has Black's king on `h5`, White's king on `e5`, and White bishops on `f5` and `f6`. The preferred move is `Ke4`.

Recognize the complete four-piece arrangement under every legal translation, rotation, and reflection. The transformed Black king must remain on a board edge. When at least one transformed pattern matches, only its corresponding transformed king move receives zero `king stutter` penalty.

The rule applies in both phases and does not infer broader moat or king geometry beyond this exact relative pattern.

## Diagram

Add a `king stutter` note board showing the canonical position and an arrow from `e5` to `e4`.

## Verification

- Assert the rule's order and exact rendered text.
- Assert `Ke4` is uniquely preferred in the supplied position.
- Assert the move and eligibility transform under rotations, reflections, and valid translations.
- Assert the rule is inactive when the same relative arrangement places Black away from an edge.
- Validate the generated diagram.
- Validate and load a fresh literal loop at `cursor=0` after implementation.
