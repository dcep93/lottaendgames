# Two Bishops Rule F Same-Edge Containment

## Goal

Make Rule F enforce its displayed wording literally:

> Phase 2: If possible, force Black's king to stay on its edge, then prefer towards the corner, then checks.

A move that transfers Black's king to a different board edge must not satisfy the first Rule F priority.

## Edge identity

Record the board edge or edges occupied by Black's king before White moves. A non-corner edge square has one edge identity. A corner has both incident edge identities.

A White candidate passes Rule F's containment priority only when Black has at least one starting edge identity, has at least one legal reply, and every legal Black reply remains on one of those same starting edges. A reply on another edge or in the interior fails containment. If Black starts off the edge, Rule F is inert.

Corner distance and checking status are compared only when every surviving candidate passes same-edge containment, preserving the existing conditional priority behavior.

## Verification

Add a direct edge-switch rejection and cover rotations and reflections, while retaining the existing same-edge, conditional corner-distance, and check-order tests. Run the focused policy suite, build, lint, and diff checks. Then find, independently validate, and load an h1-oriented exact loop at `cursor=0`.
