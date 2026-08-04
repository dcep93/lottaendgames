# Two Bishops Mate-in-Three Activation and Sequester Split

## Goal

Make the existing mate-in-three pattern available whenever its exact board geometry exists, regardless of the displayed phase. Replace the grouped `sequester` rule with four visible Phase 2 rules so each comparison owns its own rendered explanation and move-log reason.

## Rule order and copy

The relevant priorities will appear in this order:

1. `mate in 3` — With Black's king in the corner and White's king in a mating position, play mate in 3.
2. `force phase 2` — unchanged.
3. `bishops off edge` — unchanged.
4. `sequester` — Phase 2: Ensure Black cannot leave the edge.
5. `corner drive` — Phase 2: Force Black's king towards White's king's proximate corner.
6. `king position` — Phase 2: Keep White's king a knight's move from the corner.
7. `bishops away` — Phase 2: Keep the bishops farther from the kings.

The remaining Two Bishops rules retain their current order.

## Mechanics

The mate-pattern detector will no longer reject a position merely because the board-derived phase classifier reports Phase 1. Its existing exact mate-in-three and former mate-in-two pattern checks remain unchanged. Degenerate repair remains earlier in the ordered policy.

The four current `sequester` subpriorities become four adjacent `OrderedRule` entries. Each rule uses one existing score field and one comparator:

- `sequester`: minimize `sequesterEdgeEscapePenalty`.
- `corner drive`: minimize `sequesterMaximumCornerReplyDistance`.
- `king position`: minimize `sequesterCornerSupportDistance`.
- `bishops away`: maximize `sequesterBishopKingDistance`.

All four rules retain the existing Phase 2 activation flag. Because their order and comparisons are unchanged, the split preserves the current lexicographic move selection while exposing the particular decisive concept as the reason.

## Verification

Focused verification will cover:

- mate-in-three pattern activation in a position classified as Phase 1;
- exact visible rule order and rendered copy;
- one comparator and no subpriorities on each split rule;
- the existing mate, safety, stalemate, statelessness, and D4 symmetry assertions;
- directly affected presentation tests and TypeScript;
- a fail-first Two Bishops loop search, followed by browser validation of a refreshable localhost replay link.

The full mate suite, deployment, commits, and exhaustive loop validation are out of scope.
