# Rook Checkmate Flow Quality Pass

## Goal

Make the Rook trainer teach one memorable, position-based method without
weakening its exhaustive safety:

> Make a safe box. Bring White's king toward Black. When the kings face each
> other, wait with the rook so Black steps back. Shrink the box and repeat. At
> the edge, cover Black's escapes and mate.

The method does not aim for a corner. Black may be mated anywhere along an
edge.

## Scope

Keep the proven White evaluator and Black resistance policy intact unless a
verification failure exposes a real move/reason mismatch. Improve the teaching
contract around that policy:

- the strategy must be visible before the detailed priority list;
- every reason label must describe the board feature that actually selected the
  move;
- the Black resistance explanation must describe the algorithm without
  exposing low-value implementation detail;
- Phase 2 must be described as the current board shape, not as a permanent,
  history-dependent state; and
- the full-board diagram must be balanced, legible, and unshaded on desktop and
  mobile.

## White teaching copy

Keep the three universal priorities unchanged:

1. `mate`
2. `pieces safe`
3. `no stalemate`

Use these Rook priorities:

4. `edge net` — When Black reaches an edge, cover the squares beside it so the
   rook can mate.
5. `shrink the box` — Move the rook wall closer to leave Black less room.
6. `force opposition` — Bring White's king closer. When the kings face each
   other, wait with the rook so Black must step back.
7. `box black in` — Make a safe rook wall between the kings. If Black attacks
   the rook, move it to safety.

The method summary appears immediately below `White best moves`, before the
universal priorities. The numbered priorities remain in evaluator order so the
move log's reason column and the guide cannot disagree.

## Black resistance

Retain the existing algorithm and present it as four human ideas:

1. Return to the previous board position when possible.
2. Take the rook if White leaves it loose.
3. Press the nearest box wall; if the rook sits beside White's king, chase it.
4. Avoid giving White opposition, then move toward the rook.

These bullets preserve the current comparison order while combining one narrow
chasing edge case with its broader wall-pressure idea.

## Phase and diagram

Describe Phase 2 without implying state:

> Phase 2 means the rook wall is between the kings, boxing Black onto one side.

Add a second note:

> The box can drive Black to any edge; no corner is required.

The diagram remains a full 8×8 board with no highlighted or shaded squares. Use
a centered position:

- White king: d5
- White rook: e1
- Black king: f5

The kings are in direct opposition and the rook's e-file visibly separates
them. Increase the full-board note card enough for the pieces to remain legible
on desktop while allowing it to fit naturally on a narrow screen.

## Data and component boundaries

Add an optional `strategySummary` field to `RuleHelp`. The priority-guide
component renders it only when supplied, so other mating guides retain their
current content. Snapshot and freeze it with the rest of registered help data.

Add a full-board modifier to `MateRuleNoteBoard` based on an 8×8 layout. Use it
only for sizing; board semantics remain data-driven.

## Verification

- Pin the exact Rook summary, priority copy, Black resistance copy, Phase 2
  notes, centered pieces, full-board layout, lack of shading, and full-board
  sizing class.
- Confirm the strategy summary is absent from guides that do not define one.
- Inspect the Rook guide at desktop and a 390-pixel mobile viewport.
- Run focused rule and presentation tests, the complete Mate suite, lint, and
  production build.
- Re-run the symmetry-reduced exhaustive Rook policy derivation. Acceptance
  remains 21,950 proven White states, no cycle, and a maximum White rank below
  100 plies.
