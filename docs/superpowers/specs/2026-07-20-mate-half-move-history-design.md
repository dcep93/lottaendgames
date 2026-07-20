# Mate half-move Undo and Redo

## Goal

Make Mate Undo and Redo move through one ply at a time. After a completed
White/Black turn, the first Undo returns to the position after White's move and
the second Undo returns to the position before White's move. Redo traverses the
same states in reverse.

## History model

Keep `MateSnapshot` as the source of truth and store:

1. the initial White-to-move position;
2. a snapshot after White's move; and
3. when Black replies, a snapshot after Black's move.

The after-White snapshot contains the new White log entry without
`opponentSan`. The after-Black snapshot contains the completed log entry. If
White's move ends the game, only the after-White terminal snapshot is added.

All normal play, Play Best, imported replay construction, and historical move
replacement must use the same snapshot builder. A new move after Undo truncates
every later half-move snapshot. Historical replacements rebuild from the
snapshot immediately before the replaced ply rather than appending after stale
history.

## UI behavior

Undo and Redo continue to call the session operations once; because history is
now ply-based, keyboard shortcuts and buttons both advance one half-move. At an
after-White snapshot the board is Black to move, so new White input and Play
Best stay disabled. Undo, Redo, and Start Over remain available.

The existing Play Best animation remains White first and Black second. The
extra after-White snapshot is historical state and does not add another live
animation delay.

## URL behavior

A nonterminal Black-to-move `#live` FEN cannot be resumed because the automatic
Black choice is not encoded. While the user views an after-White historical
snapshot, keep the URL at the nearest White-to-move or terminal snapshot rather
than writing an unreloadable hash. Resume normal live-FEN synchronization after
Undo or Redo reaches a reloadable snapshot.

Replay hashes continue to contain complete White/Black pairs. Loading one
creates `2n + 1` history snapshots, so every encoded ply can be traversed.

## Verification

- Update session tests to require two snapshots for a complete turn and one
  history step per ply.
- Verify logs omit Black's reply after the first Undo and restore it on Redo.
- Verify branching after Undo truncates all later half-moves.
- Verify imported replay history contains every encoded ply.
- Verify buttons and keyboard shortcuts traverse the intermediate board.
- Verify URL synchronization skips nonterminal Black-to-move snapshots and
  resumes on reloadable states.
- Run the complete test suite, lint, and production build.
