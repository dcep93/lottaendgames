# Remove Two Bishops Diagonal King Step Design

## Goal

Remove `degenerate — diagonal king step` from the Two Bishops teaching policy and presentation.

## Behavior

- Delete the board matcher and its move-selection repair.
- Remove its reason label and its place in the ordered degenerate matcher list.
- Remove its note-board diagram and generated diagram position.
- Positions that formerly matched it cascade through the remaining visible priorities with no replacement exception.
- Preserve all other degenerate repairs, their relative order, Phase 2 classification, and D4 symmetry.

## Verification

- Remove exact fixtures that exist only to define or prioritize diagonal king step.
- Update diagram ordering/count assertions after deleting its board.
- Add or retain a semantic regression showing a former match no longer reports `degenerate — diagonal king step`.
- Run focused Two Bishops rule and presentation tests, TypeScript, generated-diagram checks, diff hygiene, and the fail-fast loop search.

## Non-goals

- Do not replace the removed repair with another selector.
- Do not modify unrelated Two Bishops rules or run the full mate suite.
- Do not commit, push, or deploy.
