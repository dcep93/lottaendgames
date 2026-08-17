# Two Bishops Summed Bishop Distance Design

## Scope

Refine the existing `bishop distance` priority without changing its rendered text or position in the rule order.

## Scoring

After White's move, calculate each bishop's Chebyshev distance from Black's king and add the two distances. Prefer the greatest sum.

In the supplied comparison, `Ba6` leaves bishop distances 2 and 2 for a score of 4. `Bf1` leaves distances 4 and 2 for a score of 6, so `Bf1` wins.

## Verification

- Assert the exact summed scores for `Ba6` and `Bf1`.
- Assert `Bf1` is uniquely preferred in the supplied Phase 1 position.
- Cover every rotation and reflection.
- Preserve the rendered `bishop distance` text and priority order.
