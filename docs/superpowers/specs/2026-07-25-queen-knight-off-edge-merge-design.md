# Queen Knight-and-Edge Rule Merge

## Goal

Replace the two Queen priorities

- `white pieces off edge`
- `queen a knight move from black`

with one visible priority:

> **queen a knight move from black** — Keep the queen a knight's move from
> Black's king, but not on the edge of the board.

The evaluator, reason column, and training guide must expose the same rule.

## Design

Keep one Queen score field for edge occupancy and one for the knight-move
relationship. Narrow the merged rule's edge field to the Queen only.

The single ordered rule compares the Queen edge penalty first and the
knight-move penalty second. This preserves the proven evaluator order and is
clearer than summing them into a score that would make one satisfied condition
tie with the other.

The removed rule also kept White's King off edge squares, and removing that
behavior recreates a king-shuffle loop. Move that responsibility into the
existing `king closer` priority and say so explicitly:

> **king closer** — Move White's king closer to Black, but keep it off the edge
> and do not cross the tighter side of the queen's box.

This keeps both displayed rules aligned with their evaluator comparisons.

Remove the standalone `white pieces off edge` rule and its guide entry. A move
whose first decisive comparison occurs in either part of the merged rule must
report `queen a knight move from black` as its reason.

## Verification

- Assert the Queen rule IDs and guide labels contain only the merged rule.
- Assert White King edge occupancy does not affect the merged Queen rule but
  is compared by `king closer`.
- Assert Queen edge occupancy is compared before the knight-move relationship.
- Update literal score and reason fixtures.
- Verify the presentation renders the merged title and copy and omits
  `white pieces off edge`.
- Run the focused Queen tests, full Mate tests, lint, and production build.
