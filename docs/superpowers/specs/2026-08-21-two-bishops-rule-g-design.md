# Two Bishops Rule G Design

## Goal

Add Rule G immediately after `prepare mate` in the Two Bishops white-move priorities.

Rendered rule text:

> **rule g** — Of bishops on Black's side of the king moat, take the one furthest from White and move it furthest from the king moat on White's side.

## Selection

Rule G is inactive when the position has no recognized king moat or no bishop strictly on Black's side of a moat.

For each recognized moat independently:

1. Find bishops strictly on Black's side of that moat.
2. Keep the bishop or bishops with the greatest king-step distance from White's king.
3. Consider legal moves by those bishops whose destination is strictly on White's side of the same moat.
4. Keep destinations with the greatest perpendicular king-step distance from that moat.

The union of the best moves across valid moats receives zero Rule G penalty. All other moves receive a penalty when Rule G applies.

## Integration

Rule G is independent of `onsides` and appears immediately after `prepare mate`. Existing higher-priority legality, safety, stalemate, and prepare-mate rules remain unchanged.

## Verification

- Assert the rendered order and exact text.
- Assert selection of the bishop farthest from White.
- Assert maximum distance beyond the moat on White's side.
- Assert inactivity without a recognized moat or eligible bishop.
- Run focused Two Bishops tests and validate a fresh literal loop in the app at `cursor=0`.
