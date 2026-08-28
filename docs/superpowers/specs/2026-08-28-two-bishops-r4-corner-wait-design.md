# Two Bishops r4 Corner-Wait Design

## Goal

Make rule r4 choose a bishop waiting move from positions such as
`k7/2K5/8/8/8/8/8/4BB2 w - - 0 1`, where Black is already in the target
corner and White has the r4 wall and king placement. The preferred move must
preserve a forced mate in three.

## Design

Rule r4 remains history-free. Its corner stage is recognized from board
geometry: Black occupies the target corner, the bishops control adjacent
diagonals enclosing Black, and White's king occupies the supporting r4 area.

At that stage, r4 prefers non-checking bishop moves that:

- keep both bishops on the same adjacent diagonal wall;
- do not expose either bishop to capture;
- avoid stalemate; and
- preserve the r4 geometry after every legal Black reply.

These bishop waits rank ahead of king waits and immediate checks. The runtime
policy uses only geometry and legal replies; it does not run a mate solver or
inspect move history.

## Verification

Focused tests cover the supplied FEN and all rotations/reflections. A bounded
forced-mate traversal verifies that every preferred waiting move mates within
three White moves against every Black reply and that r4 continues to terminate.
Afterward, run the focused Two Bishops suite and the existing exhaustive,
cached, early-exit loop search.

