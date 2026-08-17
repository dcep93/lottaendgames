# Two Bishops Squeeze Quality Design

## Scope

Break Rule V ties when more than one valid squeeze bundle is available. Keep the rendered Rule V text unchanged.

## Scoring

Each squeeze bundle has a primary diagonal. Its anchor is the square on that primary diagonal that is edge-adjacent to Black's king. The bundle's quality is the anchor square's distance from the nearest board edge.

Rule V first requires a move to satisfy its existing primary-or-secondary squeeze condition. Among satisfying moves, prefer the greatest anchor edge distance. Later priorities still break ties between equally good bundles.

In the supplied loop position, `Be5` uses the primary diagonal anchored at f6, while `Bf8` uses the primary diagonal anchored at h6. Since f6 is farther from the edge, `Be5` is uniquely preferred.

## Verification

- Assert `Be5` is uniquely preferred to `Bf8` in the supplied Phase 1 position.
- Assert f6's bundle scores higher than h6's bundle.
- Apply every board rotation and reflection to the position and expected move.
- Preserve existing Rule V behavior when only one bundle is valid or bundles have equal quality.
