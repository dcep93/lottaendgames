# Final Queen and Rook Copy Design

## Goal

Use the approved terse Queen and Rook training text without changing move
selection.

## Queen

Render:

> **corner cage** — Confine Black in the narrowest queen-to-corner box. Keep
> White’s king outside and leave Black at least two safe squares.

The evaluator continues comparing the box's shorter side first and longer side
second. That ordering is an implementation rule and is not rendered.

Render Queen's final Black priority as:

> Move toward the center.

## Rook

Render:

> **rook box** — Create, keep, and shrink Black’s box against the board edge.
> Move an attacked rook as far away as the box allows. If no box is possible,
> move the rook as far from Black as possible.

> **waiting move** — When the kings are a knight's move apart, or every box
> shrink hangs the rook, keep the box and move the rook, as far from Black as
> possible, but closer to White's king, but not touching White's king.

Render the Phase 2 note as:

> Phase 2 begins when the rook’s rank or file lies between the kings, boxing
> Black against an edge.

Keep the Black capture priority:

> Take a piece if White isn't looking.

Render the diagonal-Rook priority as:

> If the rook is diagonally beside White’s king, move toward it.

## Verification

- Assert the exact rule, note, and Black-priority strings.
- Assert the rendered modal includes the new Queen corner-cage copy and omits
  “shorter side first, then longer.”
- Run focused rule and presentation tests.
- Run TypeScript and diff checks.
- Do not rerun loop verification because move-selection logic is unchanged.
