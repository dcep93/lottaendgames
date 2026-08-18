# Two Bishops Onsides Priority Design

## Scope

Add `onsides` immediately after `edge flank`, and restore `boot scoot n block` to maneuver-only geometry.

Rendered text:

> onsides — Prefer bishops on White's side of the king moat.

> boot scoot n block — When the kings are in opposition and a bishop controls the secondary squeeze diagonal on the side closer to the kings, moat use a bishop to boot the king towards that squeeze diagonal. Then scoot to opposition on the next position. Finally, block the king's escape. (See gif)

## Behavior

When the starting kings define an opposition or knight-step king moat, `onsides` counts the bishops left on Black's side after White's candidate move. Zero offside bishops is best, followed by one, then two. A bishop directly on the moat counts as being on White's side.

The starting moat and starting White side remain fixed while all candidate moves are compared. A candidate king move cannot redefine its scoring line.

`boot scoot n block` no longer checks which side of the moat contains the bishops. Its existing boot, scoot, block, nearer-side, moat-widening, symmetry, and all-phase mechanics remain unchanged.

## Implementation

Store the starting moat geometry in the shared White-position context. Score each candidate's resulting bishops with an offside count, and register the new comparison immediately after `edge flank`. Remove the recently added White-side gates from each boot-scoot stage while retaining the reusable moat-side helper for `onsides`.

## Verification

- Assert evaluator and rendered ordering after `edge flank`.
- Prove independent scores of zero, one, and two offside bishops, including a bishop on the moat.
- Prove `onsides` defeats the false `Kd3` boot-scoot continuation in the supplied position.
- Preserve the GIF sequence, translation/reflection/rotation coverage, and Phase 2 rule scope.
- Run targeted tests, lint, and build.

## Assumptions

- The rule applies only when the starting kings define an existing opposition or knight-step moat.
- The rule evaluates candidate-result bishop squares against that fixed starting moat.
- The priority is active in both phases.
