# Global Two Bishops King Closer

## Rule

Render:

> **king closer** — Bring White's king closer to Black's king, preferring proximity to the the middle 16 squares.

Apply `king closer` in both phases. Compare resulting positions first by squared Euclidean distance between the kings, then by White king proximity to the middle sixteen squares.

Retain the existing Phase 2 edge-line safeguard as the first internal comparison. It is zero for every Phase 1 move, so Phase 1 behavior is exactly the two comparisons stated above while existing Phase 2 behavior remains intact.

## Verification

Update rule registration, rendered guidance, and the Phase 1 applicability regression. Run the Two Bishops, presentation, TypeScript, lint, and diagram checks. Find an exact Phase 1 policy cycle while treating entry into Phase 2 as successful termination, then open the local replay on port 5173.
