# Mate Replay URL Preservation

## Goal

Keep a seeded mate replay refreshable. A URL containing `#fen=…&moves=…&cursor=0` must remain in the address bar while the user traverses that replay with Undo and Redo, so refreshing restores the starting position with the complete line still available to Redo.

## Design

Treat the history array created by `createMateReplaySession` as the immutable identity of a replay loaded with `cursor=0`. `MateWorkspace` records that initial history only for this refreshable, start-seeded form. Undo and Redo preserve the history array, so their URL-sync effects leave the replay URL untouched. Replays without `cursor=0` retain their existing live-position synchronization.

Playing a new move, Play Best, or another operation that branches or replaces the session creates a new history array. At that point the workspace resumes its existing behavior and replaces the address with the current `#live=…` position. Ordinary non-replay sessions are unchanged.

This avoids adding new cursor values or encoding transient navigation state. The replay URL remains a stable seed, not a serialization of the currently displayed ply.

## Verification

- A replay mounted at `cursor=0` does not call the live-URL replacement callback initially.
- Undo and Redo through the seeded replay continue to preserve the replay URL.
- A move that branches from the replay causes the normal live URL replacement.
- Existing route/replay tests remain green.
- In a fresh localhost tab, the loop URL loads at its initial board, Redo traverses all plies, and refreshing restores the initial board with Redo enabled.

## Scope

Change only replay URL synchronization and its focused tests. Do not change replay encoding, chess policy, or loop-search behavior. Do not run the full mate suite.
