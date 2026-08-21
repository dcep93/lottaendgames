# Two Bishops Onsides Priority Design

## Scope

Add `onsides` immediately after `edge flank`, and restore `boot scoot n block` to maneuver-only geometry.

Rendered text:

> onsides — Move a bishop behind Black's king as close as possible to the square behind White's king from Black's king's perspective unless it can be attacked at that destination on the next move.

> boot scoot n block — When the kings are in opposition and a bishop controls the secondary squeeze diagonal on the side closer to the kings, use a bishop boot to control the other primary squeeze diagonal. Then scoot to opposition on the next position. Finally, block the king's escape. (See gif)

## Behavior

When the starting kings define a behind-Black region, `onsides` considers bishop moves into that region and ranks their destinations by proximity to the square behind White's king from Black's perspective.

Before ranking distance, reject a destination when Black has a legal king move that either captures the moved bishop there or finishes adjacent to that destination. If every otherwise qualifying onsides destination is vulnerable, leave `onsides` inactive and allow later rules to decide.

The starting moat and starting White side remain fixed while all candidate moves are compared. A candidate king move cannot redefine its scoring line.

`boot scoot n block` no longer checks which side of the moat contains the bishops. Its existing boot, scoot, block, nearer-side, moat-widening, symmetry, and all-phase mechanics remain unchanged.

## Implementation

Generate the legal Black replies after each candidate bishop move and filter destinations attacked by the resulting Black-king square. Rank only the remaining safe onsides moves with the existing behind-Black target metric.

## Verification

- Assert evaluator and rendered ordering after `edge flank`.
- Prove `Bg6` is excluded when `...Kg5` attacks it on Black's next move.
- Preserve an existing safe onsides selection and the fallback when no safe destination exists.
- Prove `onsides` defeats the false `Kd3` boot-scoot continuation in the supplied position.
- Preserve the GIF sequence, translation/reflection/rotation coverage, and Phase 2 rule scope.
- Run targeted tests, lint, and build.

## Assumptions

- The rule applies only when the starting kings define an existing opposition or knight-step moat.
- “Attacked on the next move” includes both a legal capture on the destination and a legal king move finishing adjacent to it.
- The priority is active in both phases.
