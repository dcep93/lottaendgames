# Remove Redundant Two Bishops Sequester Rule

## Goal

Remove the current rule 8 edge-confinement comparison because `force phase 2` already owns forcing Black to the edge and keeping it there. Rename the current rule 9 `corner drive` to `sequester`.

## Resulting priorities

The relevant ordered priorities become:

1. `force phase 2` — Force Black's king to the edge and keep it there.
2. `bishops off edge` — Phase 2: Move White's bishops off the edge.
3. `sequester` — Phase 2: Force Black's king towards White's king's proximate corner.
4. `king position` — unchanged.
5. `bishops away` — unchanged.

The old `sequesterEdgeEscapePenalty` comparison will no longer eliminate moves. The score field may be removed if no remaining production or focused-test consumer requires it.

## Verification

Focused tests will verify the visible order and copy, one comparator per remaining Phase 2 rule, absence of the deleted rule mechanic, updated reason ownership, statelessness, symmetry, safety, presentation, TypeScript, and diff validity. The fail-first Two Bishops loop finder will provide one refreshable localhost witness that is replayed and reloaded in the app.

The full mate suite, exhaustive validation, commits, pushes, deployment, and unrelated cleanup are out of scope.
