# Two Bishops Rule WW Edge-Ray Design

## Goal

Add Rule WW after Rule W and before Rule X:

> **rule ww** — Phase 2: If you don't already control the edge square 1 beyond the corner from Black's king, bishop control the edge square 2 beyond the corner from Black's king not adjacent to White's king.

## Geometry

Rule WW applies only when the starting position is Phase 2 and Black's king is on a board edge. Use the proximate corner belonging to Black's tightest eligible bishop wall.

For each edge ray that begins at Black's square and points away from that corner, inspect the next two edge squares. When Black occupies the corner itself, both incident edge rays point away from the corner and are eligible. For the h1 orientation, Black on h1 produces `g1→f1` and `h2→h3`; Black on h3 with h1 as the wall corner produces `h4→h5`.

Before White moves, discard a ray when a bishop already controls its first square or when its second square is adjacent to White's starting king. The second square of every remaining on-board ray is a Rule WW target. Target eligibility stays fixed for the turn, including when White moves the king. The rule is inactive when there are no such targets, including when Black is not on an edge or a ray does not contain two further board squares.

## Move ranking

A candidate White move receives the preferred score when, in the resulting position, either bishop controls at least one Rule WW target through an unobstructed line. The bishop need not have moved and may preserve control it already supplied. Qualifying targets tie; Rule WW does not maximize the number of targets controlled. Later rules break remaining ties.

## Verification

- Assert the visible order `rule w`, `rule ww`, `rule x` and exact Rule WW text.
- Cover the h1 corner rays and an h3 outward ray.
- Prove preserved control qualifies, including the requested `Bf5` and `Bf6` moves.
- Reject a second-square target adjacent to White's starting king; in the h1 fixture, ignore `f1` beside the king on `f2` while retaining `h3`.
- Reject king-screened or otherwise obstructed bishop control.
- Verify rotations and reflections.
- Run focused tests, build, lint, and diff checks.
- Find, independently validate, and load an h1-oriented loop at `cursor=0`.
