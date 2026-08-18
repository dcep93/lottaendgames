# Two Bishops Edge Flank Knight-Distance Design

## Goal

Restrict `edge flank` to positions where the kings start and finish a knight's move apart.

## Behavior

- The rule applies only when Black's king is on an edge and the starting kings are a knight's move apart.
- A move satisfies the rule only when it retains the existing diagonal flank target behavior and the resulting kings are also a knight's move apart.
- Keep the rendered rule text, diagram, score priority, and symmetry behavior unchanged.

## Regression

For `8/8/1B6/8/6K1/3B4/8/4k3 w - - 4 3`, `edge flank` must not apply because the starting kings are not a knight's move apart.

## Verification

- Add focused starting- and resulting-distance assertions.
- Preserve existing Edge Flank translation, rotation, reflection, Phase 2, and diagonal-movement tests.
- Run focused and full app checks.
- Find and open a fresh strict Phase 1 loop, treating Phase 2 as termination.
