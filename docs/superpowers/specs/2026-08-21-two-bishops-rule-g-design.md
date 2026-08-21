# Two Bishops Rule G Design

## Goal

Add Rule G immediately after `prepare mate` in the Two Bishops white-move priorities.

Rendered rule text:

> **rule g** — Of bishops on Black's side of all king moats, take the one furthest from White and move it furthest from the king moat on White's side and not closer to black in either axis.

## Selection

Rule G is inactive when the position has no recognized king moat or no bishop strictly on Black's side of a moat.

1. Find bishops strictly on Black's side of every recognized moat.
2. Keep the bishop or bishops with the greatest king-step distance from White's king.
3. Consider legal moves by those bishops whose destination is strictly on White's side of at least one recognized moat and whose absolute file and rank distances from Black's king are each at least their respective pre-move distances.
4. For each crossed moat, keep destinations with the greatest perpendicular king-step distance from that moat.

The union of the best destinations across crossed moats receives zero Rule G penalty. All other moves receive a penalty when Rule G applies.

## Integration

Rule G is independent of `onsides` and appears immediately after `prepare mate`. Existing higher-priority legality, safety, stalemate, and prepare-mate rules remain unchanged.

## Verification

- Assert the rendered order and exact text.
- Assert selection of the bishop farthest from White.
- Assert maximum distance beyond the moat on White's side.
- Assert a destination is rejected when it moves closer to Black's king on either the file or rank axis.
- Assert a bishop is ineligible when it is on Black's side of one moat but White's side of another.
- Assert inactivity without a recognized moat or eligible bishop.
- Run focused Two Bishops tests and validate a fresh literal loop in the app at `cursor=0`.
