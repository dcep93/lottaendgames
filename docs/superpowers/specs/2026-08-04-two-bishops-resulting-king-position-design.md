# Two Bishops Resulting King Position Design

## Goal

Fix `king closer` so it evaluates White's resulting king position regardless of which piece White moves. A bishop waiting move must preserve credit for a king that is already on the preferred Phase 2 rank or file.

## Design

- Determine the resulting White king square after every legal White move. For a king move, use the destination square; for every other move, use the starting king square.
- Compute the Phase 2 preferred-line penalty from that resulting square without requiring the moved piece to be the king.
- In Phase 2, compute king distance from that resulting square for every move instead of assigning bishop waiting moves the sentinel score `99`. Preserve the existing Phase 1 behavior, where `king closer` actively selects a king move.
- Keep the existing rule order, rendered text, phase classifier, distance metric, and all other Two Bishops selectors unchanged.

## Verification

- Add a focused regression for `8/8/8/8/5B1k/5B2/5K2/8 w - - 0 1` proving `Be2` preserves the preferred king line and receives the actual unchanged king distance.
- Prove `Be2` is no longer rejected in favor of the cycling `Kf1` solely because it is a bishop move.
- Apply the regression through every D4 transform.
- Run the focused Two Bishops rule tests, targeted TypeScript and diff checks, then the small fail-fast loop search.

## Non-goals

- No new rule or visible copy.
- No history-aware selection, lookahead, or witness-specific exception.
- No unrelated Two Bishops policy changes.
