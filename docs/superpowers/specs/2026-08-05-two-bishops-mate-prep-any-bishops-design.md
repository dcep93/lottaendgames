# Two Bishops Mate Prep with Arbitrary Bishops

## Objective

Make `degenerate — mate prep` depend on the finishing king geometry, regardless of the bishops' legal squares.

## Matcher

- Keep the reference king stencil: Black king `g8`, White king `f6`, White to play `Kg6`.
- Apply all eight D4 rotations and reflections.
- Do not translate the king stencil.
- Require the existing Phase 2 classifier and a legal transformed king move.
- Do not inspect or score either bishop square beyond the enclosing Two Bishops material validation.

## Behavior

- In `8/8/8/8/8/5K2/7k/3BB3 w - - 0 1`, select only `Kf2` with reason `degenerate — mate prep`.
- Evaluate the broad mate-prep matcher after all more-specific degenerate repairs, so it does not make their diagrams unreachable.
- Keep the repair terminal so lower priorities cannot replace the mating preparation.
- Keep the existing mate-prep diagram as one example; its bishop locations are illustrative, not requirements.

## Verification

- Test the diagram position and all D4 transforms.
- Test the supplied arbitrary-bishop position and all D4 transforms.
- Test at least one other legal bishop placement with the same kings.
- Retain rejection of a translated king stencil.
- Run focused Two Bishops tests, affected presentation tests only if presentation changes, TypeScript, diagram freshness, and diff checks.
- Find and load the next loop whose complete cycle stays in Phase 2.

## Assumptions

- “Bishops can be anywhere” includes edge squares and positions that do not reproduce the diagram's controls, provided the overall position and `mate prep` king move are legal.
- The user is broadening only `mate prep`; other degenerates keep their existing bishop requirements.
- When the king stencil overlaps a more-specific degenerate, the specific repair wins; otherwise mate prep is the degenerate fallback.
