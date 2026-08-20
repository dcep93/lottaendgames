# Bishop Euclidean Distance

## Design

Keep the existing king-moat eligibility for `bishop distance`. Replace each qualifying bishop's king-step distance from Black's king with exact Euclidean distance, then maximize the sum across qualifying bishops. Do not change the rendered rule text.

## Verification

Add a focused regression whose Euclidean ordering differs from king-step ordering, retain the two-moat regression, and verify a local loop at `cursor=0`.
