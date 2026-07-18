# Mate Replay Links

## Goal

Create a self-contained localhost Mate URL that opens at the end of a supplied
legal line with ordinary session history already populated. The existing Undo
and Redo controls must travel through that line one complete White/Black turn
at a time.

The first use is the exact Rook loop found by the exhaustive verifier, but the
format is generic for all supported Mate sets.

## URL Format

Replay state lives in the existing URL hash alongside the exact starting FEN:

```text
#fen=<percent-encoded FEN>&moves=<percent-encoded space-separated SAN>
```

FEN-only links remain valid and retain their current canonical form. Replay
links are canonicalized by decoding the FEN and SAN, replaying the moves, and
re-encoding both fields. Unknown fields, duplicate fields, malformed escaping,
empty move lists, excessive move lists, and illegal moves invalidate the Mate
route instead of partially loading it.

The payload is capped at 512 plies. A replay must start from a supported exact
Mate position, begin with White to move, contain complete White/Black turns,
and remain non-terminal until its final recorded turn.

## Session Reconstruction

A new pure session constructor starts with `createMateSession` and replays each
SAN pair through the same turn-completion path used by interactive play. The
URL's Black SAN is selected explicitly from the legal production candidates,
while White correctness, phases, reasons, response counts, outcomes, logs, and
snapshots are computed rather than trusted from the URL.

Each completed pair creates one normal history snapshot. The loaded session's
history index points at the final snapshot, so Undo moves backward through the
line and Redo restores it. Start Over retains its existing behavior and creates
a fresh generated position.

## Routing and Rendering

Mate route state gains an optional replay move list. The workspace key includes
the canonical replay so navigating between two lines with the same starting
FEN rebuilds the drill. The workspace initializes from the replay constructor
when moves are present and otherwise follows the existing FEN-only path.

There is no new panel, banner, or demo-specific UI. The loaded board, log, Undo,
and Redo controls provide the showcase.

## Failure Handling

URL decoding performs syntax, size, supported-start, complete-turn, and chess
legality validation. Session reconstruction independently validates evaluator
and candidate invariants. If reconstruction unexpectedly fails, the workspace
falls back to a normal session at the decoded starting FEN rather than crashing.

## Tests and Verification

Tests cover:

- backward-compatible FEN-only hashes;
- canonical replay encoding and decoding;
- malformed, oversized, incomplete-turn, illegal, and post-terminal rejection;
- route preservation of replay state;
- exact Rook witness reconstruction at the repeated position;
- Undo reaching the prior loop state and eventually the starting FEN;
- Redo restoring the final position;
- workspace initialization with replay history;
- interactive localhost verification of the final board and Undo behavior;
- full Mate tests, lint, and production build.
