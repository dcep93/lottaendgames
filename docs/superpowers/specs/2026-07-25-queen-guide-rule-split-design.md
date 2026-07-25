# Queen Guide Rule Split

## Goal

Make every Queen reason hint name one concrete idea. Remove the Queen diagram,
which repeats information that the rule list can explain more directly.

## Displayed Rules

Keep the evaluator comparisons in their current order, but give each comparison
its own visible rule:

1. `mate`
2. `pieces safe`
3. `no stalemate`
4. `two-square corner cage` — Keep Black confined to two squares near a
   corner.
5. `king toward cage support` — With the cage established, bring White's king
   toward a mating-support square.
6. `white pieces off edge` — Move White's pieces off edge squares.
7. `queen a knight move from black` — Keep the queen a knight's move from
   Black's king.
8. `queen box size` — Shrink the box's shorter side before its longer side.
9. `king closer` — Move White's king closer without blocking the queen's rank
   or file.

The first cage rule explains the geometry explicitly as two squares near a
corner. The second rule explains the separate king-approach comparison. The
three comparisons previously grouped as `tighten the net` are restored as
separate rules so the move log can identify the actual deciding priority.

## Presentation

Remove the Queen note-board data. Rook and Two Bishops diagrams are unchanged.
The Queen modal retains its phase note, keyboard shortcuts, and legend.

## Behavior and Verification

Do not change Queen scoring or comparison order. Update fixture reason IDs,
registered-rule expectations, modal rendering tests, and reason-highlight
tests. Run the focused Queen and presentation tests, the full Mate suite, lint,
build, and a 390-pixel responsive modal check.
