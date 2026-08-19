# Two Bishops Onsides Relocation Design

## Scope

Replace the passive `onsides` bishop-count comparison with an active relocation rule while preserving its priority immediately after `edge flank`.

Rendered text:

> If a bishop is on the wrong side of the king moat, move it to a square furthest from Black's king and closer to White's king.

## Behavior

Use the fixed king moat defined by the starting kings. Identify bishops strictly on Black's side; a bishop directly on the moat is not offside.

Consider legal moves by an offside bishop whose destination is strictly closer in king-step distance to White's king than to Black's king. The destination may remain on Black's side of the moat. Among these qualifying moves, maximize king-step distance from Black's king. Exact ties remain equally preferred.

If neither bishop is offside, or no qualifying relocation exists, `onsides` is inactive and later rules decide. When the rule is active, king moves and moves by an already-onside bishop do not satisfy it.

## Implementation

Replace the position context's moat score with a precomputed preferred-SAN list. Generate the list from legal bishop moves, offside starting bishops, the fixed starting moat, and the two king-step distance predicates. Score moves by membership in that list.

## Verification

- Update evaluator and rendered copy without moving the rule from after `edge flank`.
- Cover an offside bishop that relocates onsides and one that legally remains offside.
- Cover the strict closer-to-White filter and maximum distance from Black.
- Cover inactivity when no bishop is offside or no eligible destination exists.
- Preserve translation/reflection/rotation behavior and all-phase scope.
- Run targeted tests, lint, and build.

## Assumptions

- “Closer” and “furthest” both use king-step (Chebyshev) distance.
- Closer to White is a strict inequality.
- The moat remains fixed from the starting position while candidate moves are compared.
