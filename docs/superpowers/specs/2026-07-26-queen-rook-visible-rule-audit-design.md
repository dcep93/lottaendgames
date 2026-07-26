# Queen and Rook Visible-Rule Audit Design

## Goal

Ensure every Queen and Rook move-selection comparison is a mechanical
implementation of a rendered teaching rule. Remove concealed Rook heuristics
instead of adding more instructional copy.

## Queen Audit

The Queen selector is aligned:

| Mechanic | Rendered rule |
| --- | --- |
| Immediate mate | `mate` |
| Queen cannot be captured | `pieces safe` |
| Avoid stalemate | `no stalemate` |
| White King outside the cage, at least two safe squares, shorter side then longer side | `corner cage` |
| Queen a knight's move from Black and off the edge | `knight's move away` |
| White King stays outside the tighter channel and off the edge, then approaches Black | `king closer` |
| Black recreates the previous position, captures the Queen, then approaches the center | Rendered Black priorities |

One Queen tie-break detail remains unrendered by explicit user request:

- Row-plus-file King distance breaks ties after king-move distance under
  `king closer`.

Shorter Queen travel is now rendered inside `knight's move away`; it only
compares multiple Queen moves that already satisfy that placement. Neither
tie-break can override the visible condition of its rule.

The Queen and Rook production selectors do not import the existing major-piece
mate-progress lookup.

## Rook Problems

Remove these concealed mechanics:

- `rookExposed`: blocks a safe box shrink when the Rook is closer to Black than
  White.
- `rookHome`: favors placing the Rook beside White's King on a selected side.
- `rookSafe`: favors moving the Rook to a different edge.

They are not stated by `rook box`, and `pieces safe` already handles legal
captures.

## Rook Box Mechanics

Implement `rook box` directly:

1. If no box exists, prefer moves that create one.
2. If a box exists, reject moves that enlarge or lose it.
3. Among Rook moves that create or shrink a box, prefer the smallest
   guaranteed box. King moves may preserve a wall but do not receive
   Rook-shrink credit.
4. A checking squeeze uses the largest box Black can obtain among all legal
   replies.
5. If no candidate creates a box, prefer a Rook move and maximize its king-move
   distance from Black; use row-plus-file distance only as a tie-break.
6. If the starting Rook is attacked, maximize the same distance only after box
   creation, preservation, and size have been resolved. When `waiting move`
   applies, its stricter placement conditions decide instead.

The existing `waiting move` and `king closer` comparisons remain:

- `waiting move` applies when the kings are a knight's move apart; it keeps the
  box, leaves the Rook closer to White than Black and not touching White, then
  maximizes distance from Black.
- `king closer` reduces at least one axis without increasing the other,
  preferably without taking opposition.

## Black Audit

Queen Black priorities match their rendered list.

Rook Black priorities also match their rendered order: recreate the previous
position, take the Rook, approach the nearest box wall, approach a diagonally
adjacent Rook, avoid giving opposition, then approach the Rook.

The previous-position priority is stateful but is explicitly rendered; it is not
a concealed selector.

## Verification

- `Rh7` must uniquely shrink the reported size-2 box to size 1.
- Existing box, checking-squeeze, waiting-move, attacked-Rook, no-box fallback,
  Queen, symmetry, and Black-priority tests must pass.
- A source audit must reject the removed Rook heuristic names and all
  tablebase/progress/history selectors in Queen or Rook White scoring.
- TypeScript and diff checks must pass.
- Reuse the latest exhaustive Queen cycle result when Queen selection code is
  unchanged; otherwise rerun it. Run the exhaustive Rook verifier at low
  priority. Report failures without inventing another rule.
