# Manual Black board moves design

## Goal

When a Mate session is on a Black-to-move half-move snapshot, allow the user to
play any legal Black move directly on the board.

## Board interaction

Generalize move resolution and piece selection from White-only to the side to
move. A piece is selectable when its color matches the FEN turn. Click, drag,
legal-target markers, optimistic rendering, and the 100 ms board animation use
the same path for both colors. The board remains White-oriented.

Terminal positions and Play Best animation still disable board input.

## Session transition

Add a single-ply Black transition for a session whose current FEN is Black to
move and whose final log entry contains White's move without `opponentSan`.
The transition:

- accepts any legal Black move, not only evaluator-ideal replies;
- completes the pending log entry with canonical Black SAN and reply counts;
- computes the terminal outcome;
- appends the resulting White-to-move or terminal snapshot;
- truncates any Redo history after the current Black-to-move snapshot.

White board moves retain the existing behavior: White moves first and the
automatic Black response follows after its animation. The workspace dispatches
board SAN according to the current FEN turn.

## Controls and URL

Play Best remains available only on White's turn. Undo and Redo remain one ply
per action. While parked on the intermediate Black-to-move snapshot, URL sync
continues to retain the nearest reloadable White-to-move FEN. After the manual
Black move, URL sync advances to its resulting reloadable FEN.

## Verification

- Board unit tests accept legal Black clicks/drops and reject the wrong color.
- Session tests prove legal Black play, canonical SAN, terminal handling, and
  Redo truncation.
- Presentation tests Undo to Black's turn, play Black on the board, and verify
  the board, log, controls, and URL.
- Run Mate tests, lint, and the production build.
