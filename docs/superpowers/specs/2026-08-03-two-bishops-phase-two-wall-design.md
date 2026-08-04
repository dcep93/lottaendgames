# Two Bishops Phase 2 Wall

## Goal

Replace four interacting Phase 2 distance rules with a simpler geometric progression:

1. Create or maintain the two-square bishop wall attached to Black's king.
2. Force Black toward White's proximate corner.
3. Create or preserve direct opposition, often with a waiting move.

No new degenerate is introduced.

## Rule order

Remove these visible rules and their exclusive score fields:

- `king distance`
- the current `sequester`
- `king position`
- `bishops away`

Insert these rules after `force phase 2`, in this order:

1. `phase 2 wall` — Phase 2: Create or maintain a 2 square wall not on the same side as the white king.
2. `sequester` — Phase 2: Force Black's king towards White's king's proximate corner.
3. `take opposition` — Phase 2: Often a waiting move, take opposition with the king.

The simplified `sequester` retains the existing raw Black-reply distance comparison. The removed support-distance and bishop-distance comparisons do not remain as hidden tie-breaks.

The proximate corner is fixed from White's king in the current position before candidate moves are compared. A candidate king move cannot redefine the corner it is judged against.

The older `conclave step`, `finish wall`, `support wall`, `start wall`, and `king closer` sequence is explicitly Phase 1. Once Phase 2 applies, the new wall/sequester/opposition sequence owns the remaining comparisons.

## Phase 2 wall geometry

The rule applies when the position is Phase 2 and Black's king currently occupies an edge square.

For each valid direction along that edge:

- The first wall square is the edge square immediately beside Black's king.
- The second wall square is immediately inward from the first.
- A direction is eligible when it is opposite White's king along the edge. If White's king is directly inward from Black, either valid edge direction is eligible.
- The two White bishops must separately control the two wall squares after White's move.

The rule is D4-symmetric. It uses Black's current edge and current king square, so it is board-position-only and does not translate a witness template.

In the diagram position `2k5/8/4K3/8/5B2/5B2/8/8 w - - 4 3`, Black is on c8 and White is to its right, so the wall is b8-b7. Highlight b8 and b7.

## Opposition

Direct opposition means the kings are on the same rank or file with exactly one square between them. A king move may create it, and a bishop waiting move may preserve it. The rule compares resulting positions and does not require the moving piece to be the king.

## Required examples

- In `2k5/8/2B1K3/8/8/6B1/8/8 w - - 0 1`, `Bf4` preserves the b8-b7 wall; `Kd6` does not because White's king screens the b8 diagonal.
- In `3k4/8/4K3/8/4BB2/8/8/8 w - - 6 4`, `Bb7` creates the c8-c7 wall.
- In `5k2/2B5/2B2K2/8/8/8/8/8 w - - 14 8`, `Bd6+` creates the e8-e7 wall.

Each named move must remain among the final recommended moves after later priorities.

## Presentation and verification

Add the wall diagram and keep rendered text mechanically identical to the selectors. Focused tests cover the three required examples, existing-wall preservation, both eligible directions when White is directly inward, D4 symmetry, Phase 1 and non-edge inactivity, direct opposition creation and preservation, removal of the four old rule IDs and score comparisons, presentation, diagram freshness, TypeScript, and diff validity.

Then run the fail-fast Two Bishops loop gate and return one validated refreshable localhost loop. Do not run the full mate suite or exhaustive census. Do not commit, push, deploy, or alter unrelated dirty work.
