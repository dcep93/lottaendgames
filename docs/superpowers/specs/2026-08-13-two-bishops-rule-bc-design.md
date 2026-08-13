# Two Bishops Rule BC Design

## Priority

Add this Phase 1 priority immediately after Rule B and before Rule C:

- **rule bc** — If rule b is satisfied, and the other bishop can go to the diagonal containing the Black king and intersecting the flank diagonal, stay on the flank diagonal and in the king moat.

The visible and scoring order becomes `rule a`, `rule b`, `rule bc`,
`rule c`, `rule d`, `rule e`, then `king closer`.

## Applicability

Rule BC is staged from the starting position. For each Rule B flank diagonal
already controlled by one bishop:

1. select the diagonal through Black's king whose axis is perpendicular to the
   flank diagonal; and
2. require the other bishop to have a legal one-move destination on that
   Black-king diagonal.

If at least one satisfied flank has such an available other-bishop move, Rule
BC applies.

## Candidate score

A candidate White move satisfies Rule BC when its resulting position has a
bishop on both:

- the same applicable Rule B flank diagonal; and
- a starting king-moat rank or file.

The comparison uses resulting geometry rather than move identity. Because the
bishops occupy opposite colors, the applicable flank identifies the relevant
bishop without additional state.

For `8/8/8/5B2/8/8/3BK1k1/8 w - - 0 1`, the Rule B flank is the diagonal
through `d2-e3-f4`. The king moat is the f-file, so their intersection is `f4`.
The other bishop can reach the intersecting Black-king diagonal, making `Bf4`
the Rule BC move.

## Verification

Pin the exact rendered wording and priority order. Verify `Bf4` is the unique
recommendation in the supplied position, all board rotations and reflections
preserve its Rule BC score, and Rule BC is inactive in Phase 2. Run focused
tests, lint, build, generated-diagram verification, and a strict Phase 1 loop
search where entry into Phase 2 terminates a branch.
