# Two Bishops Rule FF

## Goal

Add Rule FF immediately after Rule F:

> Phase 2: If the White king is inside the bishop wall, it prefers squares closer to the inner bishop.

## Geometry and scoring

Rule FF uses the position before White moves. It considers the tightest qualifying Phase 2 walls whose Black-corner area contains White's king. For each such wall, `wallBishops[0]` is the existing inner bishop.

The target wall and inner bishop remain fixed while candidate moves are compared. Each candidate is scored by the squared Euclidean distance from the resulting White-king square to the fixed inner bishop. If multiple tightest walls qualify, the lowest distance is used.

Bishop moves leave the White king on its current square, so they retain its existing distance rather than changing the target by relocating a bishop. King moves closer rank ahead; moves that do not improve the king square can remain tied for later rules.

## Integration

Add dedicated Rule FF applicability and distance fields to the Two Bishops White score. Insert Rule FF after Rule F in the active teaching order and update the visible help text and active-rule tests.

## Verification

- Confirm the rule activates only in Phase 2 when White's king lies inside a tightest wall's Black-corner area.
- Confirm a closer king square beats a farther king square by squared Euclidean distance.
- Confirm moving the inner bishop cannot change Rule FF's fixed target.
- Check rotations and reflections.
- Run the focused policy tests, build, lint, and validate an h1-oriented loop before loading it at `cursor=0`.
