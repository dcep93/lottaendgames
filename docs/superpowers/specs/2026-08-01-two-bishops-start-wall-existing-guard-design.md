# Two Bishops Existing-Wall Guard and Diagram Shift

## Goal

Prevent Start Wall from selecting a move whenever an adjacent bishop wall already exists, and shift the proximate-wall teaching diagram down two ranks.

## Start Wall

A bishop wall already exists when the two bishops are orthogonally adjacent. This definition is independent of whether the wall is proximate to Black.

When a wall exists in the source position, Start Wall must not distinguish or select any move. Keep the rendered text unchanged:

> **start wall** — Place a bishop in two-square opposition to Black's king.

Keep the existing convention that Start Wall is also already satisfied when either bishop itself occupies a two-square-opposition starting square. Implement the new adjacency guard alongside that convention rather than replacing it.

## Diagram Shift

Shift every piece and highlight in the proximate-wall note board two ranks down:

- Bishops: `d6/d7` to `d4/d5`.
- Left highlights: `a5-a8, b6-b7` to `a3-a6, b4-b5`.
- Right highlights: `f6-f7, g5-g8` to `f4-f5, g3-g6`.

Do not change the underlying proximate-wall matcher, moat definition, caption, or twelve-square symmetry.

## Verification

- Assert Start Wall cannot select any move from an orthogonally adjacent, non-proximate wall.
- Assert the guard works under D4 transformations.
- Replace the historical adjacent-bishop Bf5 snapshot because the new invariant supersedes it; preserve Bf5 from an equivalent separated-bishop setup and preserve the existing two-square-opposition convention.
- Assert the diagram contains only bishops on `d4/d5` and the shifted twelve highlights.
- Run focused Start Wall, ordering, symmetry, diagram, presentation, TypeScript, and diff checks only.
- Find and verify a current localhost loop after the policy change.

## Scope

No rendered rule change, proximate geometry change, full mate suite, exhaustive validation, commit, archive synchronization, push, or deployment.
