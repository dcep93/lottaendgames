# Knight vs Queen exercise

Add `/mate/knight-queen` to the existing material navigation, using a white
knight and black queen icon like the Two Knights vs Pawn entry. This is a
single-player route exercise, not a checkmate position: no kings, no Black
turn, no Standard/Training Wheels selector, and no standard-chess PGN.

The knight starts on h8; the queen remains on d5. Queen-controlled squares and
d5 are forbidden destinations. Scan ranks from 8 down to 1, alternating
right-to-left and left-to-right, skipping forbidden squares. The user confirmed
this skip rule. There are 36 safe squares: h8 counts as the first visit, f8 is
the first target, and g1 is the final target (h1 is attacked). Revisited and
future safe squares are valid stepping stones but only the current target
advances progress. The safe knight graph is connected.

Reuse the existing board, annotation style, controls, and timer. Add a small
board interaction adapter for kingless movement and a target-square highlight.
Keep this exercise's pure movement/session model separate from chess.js mate
evaluation and the five existing mating rule sets. Breadth-first search from
the current target supplies shortest-path Best Moves. Restart, undo, redo,
move history, hidden-but-recorded timing, and keyboard shortcuts retain the
existing trainer behavior. Completion stops play and freezes the timer.

Training Info explains the unusual setup, safe destinations, snaking target
order, stepping stones, and Best Move. Escape toggles its accessible dialog.
Route completion uses exercise analytics rather than reporting a checkmate.

Implementation order: pure route/graph/session model; navigation and routing;
board adapter and target styling; exercise workspace and guide; regression
tests and production build/lint. Verification covers every safe graph edge,
the full 158-move shortest route, illegal moves, undo/redo/restart, timing,
route normalization, material icons, and interactive board/control wiring.
No full visual E2E pass or deployment is part of this change.
