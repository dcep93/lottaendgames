# King Pushable Adjacent-Diagonal Design

## Goal

Allow White's king to target either the restricted-area diagonal or a square one king step from that diagonal.

## Behavior

`king pushable` continues to prefer positions outside Black's restricted area. Among those positions, being directly on the restricted-area diagonal and being one king step from it are equally acceptable. Positions farther away remain ordered by squared Euclidean distance.

The visible help text becomes:

> Phase 1: Bring White's king to or adjacent to the restricted-area diagonal while keeping it outside Black's restricted area.

Adjacency uses king geometry, so orthogonal and diagonal neighboring squares count.

## Implementation

- Normalize the existing boundary distance by mapping raw squared distances `0`, `1`, and `2` to `0`. The value `2` represents diagonal king-step adjacency.
- Preserve the ordering of all raw distances greater than `2` by subtracting two.
- Keep the outside-area penalty as the first comparison.
- Update guide metadata, the independent policy pipeline, and focused scoring tests.

## Verification

Verify the supplied Phase 1 position, D4 symmetry, the Two Bishops and presentation tests, TypeScript, lint, and diagram freshness. Then find and open a current Phase 1 loop, treating every transition to Phase 2 as termination.

## Boundaries

- Do not change restricted-area construction.
- Do not change the rule's Phase 1 gate or priority.
- Do not change the outside-area penalty.
- Do not modify the main worktree.
