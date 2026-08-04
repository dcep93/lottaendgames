# Two Bishops bishop-advance degenerate

## Goal

Add a first-priority Two Bishops degenerate family for a specific Phase 2 bishop advance, and make degenerate matching follow the same priority order as the rendered diagrams.

## New family

The rendered reason is `degenerate — bishop advance`, with the caption `Advance the bishop with the arrowed move.`

In canonical relative geometry:

- White's king is on `f3`.
- The moving bishop is on `f2`.
- Black's king is on `h1`, `h2`, or `h3`.
- The other bishop may occupy any legal square.
- White plays `Bc5`; the family does not apply if that move is illegal.

The matcher is current-position-only and supports translations plus all D4 rotations and reflections.

## Priority alignment

The bishop-advance diagram and matcher come first. The remaining degenerate matchers are evaluated in their existing rendered diagram order:

1. bishop advance
2. edge repair
3. unmask edge bishop
4. diagonal king step
5. diagonal setup
6. diagonal waiting move
7. free bishop
8. waiting move
9. king sidestep
10. reform wall
11. king lift
12. bishop retreat
13. long diagonal

The old long-diagonal family and diagram remain even though bishop advance currently shadows its matching positions. Phase restrictions remain unchanged for every pre-existing family.

## Presentation

Add an arrowed bishop-advance diagram first in the degenerate section. Use the canonical position with the other bishop on `e6`, Black on `h2`, and an arrow from `f2` to `c5`.

## Verification

- Cover Black on `h1`, `h2`, and `h3`, representative other-bishop squares, translations, and every D4 transform.
- Prove `Bc5` uniquely wins and reports `degenerate — bishop advance`.
- Prove an obstructed `Bc5` does not match.
- Assert rendered degenerate diagram titles use the declared matcher priority order.
- Run focused Two Bishops rule, diagram, and presentation tests; TypeScript; and diff validation.
- Run the fail-first development loop finder and provide a refreshable localhost cycle.
