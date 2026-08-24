# Two Bishops Rule FF

## Goal

Add Rule FF immediately after Rule F:

> Phase 2: If the White king is inside the bishop wall, it prefers squares closer to the inner bishop.

## Geometry and scoring

Rule FF evaluates each position after the candidate White move. It considers the resulting tightest qualifying Phase 2 walls whose Black-corner area contains the resulting White king. For each such wall, `wallBishops[0]` is the resulting inner bishop.

An applicable candidate is scored by the squared Euclidean distance from the resulting White-king square to the resulting inner bishop. If multiple tightest walls qualify, the lowest distance is used.

If the resulting White king is outside every resulting tightest wall, Rule FF is non-applicable to that candidate. The candidate remains available for later rules; it is neither rewarded nor eliminated by Rule FF. This is intentionally different from assigning a zero penalty, which would make every outside move automatically beat every inside move.

## Integration

Add dedicated Rule FF applicability and distance fields to the Two Bishops White score. Insert Rule FF after Rule F in the active teaching order and update the visible help text and active-rule tests.

## Verification

- Confirm the rule activates only when the resulting position is Phase 2 and the resulting White king lies inside a tightest wall's Black-corner area.
- Confirm a closer king square beats a farther king square by squared Euclidean distance.
- Confirm `Kd5` remains available when it leaves White outside the resulting wall.
- Check rotations and reflections.
- Run the focused policy tests, build, lint, and validate an h1-oriented loop before loading it at `cursor=0`.
