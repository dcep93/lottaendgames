# Five-knight support requires an opposite-colored White king

For a five-diagonal bishop with its five-diagonal support knight (Nd5 for a4–e8, including rotations and reflections), White's king sharing the bishop's square color now unconditionally rejects support. This guard precedes all placement declarations. It restores the earlier five-bishop/five-knight color restriction and supersedes conflicting supported placements, including the former Kd7/Bb5/Nd5 outcome.

The loaded move `1. Be8` from `2k5/8/2B5/1K1N4/8/8/8/8 w - - 0 1` is unsupported: White Kb5 and Be8 are both light-squared. The recent Be8/Nd3 allowance against the a-file and the unconditional Bc6 exclusion are unchanged. No move preference or rule ordering was changed.

All 213 bishop-and-knight tests passed, along with the production build. Regression checks cover the loaded move, every eligible five-bishop square, all eight symmetries, opposite-color eligibility, and preservation of the separate Nd3 allowance. Existing examples that conflict with the restored condition now assert rejection.

The audit fingerprint below includes this working-tree change on parent cdd797e. It still fails the loop gate: 17,328 supported starts can reach loops (82.6245%), compared with 176 before this restriction; supported placements directly on cycles increased from 40 to 104. This consequence is retained rather than changing additional preferences without instruction.

Loaded [1. Ke7 Kb7 2. Kd6 Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/3K4/1B1N4/8/8/8/8_w_-_-_0_1&moves=Ke7,Kb7,Kd6,Kc8&cursor=0). This minimal four-ply loop is reachable from 13,560 supported starting placements. All moves were verified over two laps against production policy, preserving Black return history. Replay decoding passed and Redo is enabled.

## Supported-position continuation audit

Policy commit: `cdd797ec46520f973a1971611f23bd9291641060`. Fingerprint: `2717eb08a159baafbeb9f2e96a7b73ef6997cf1b2756a911737ef52602de44fa`.

The full placement census classified 13,660,584 positions and selected **20,972 supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 104 | 0.4959% |
| Not directly on a loop | 20,868 | 99.5041% |
| Can reach a loop | 17,328 | 82.6245% |
| Cannot reach a loop | 3,644 | 17.3755% |
| Can reach mate | 2,780 | 13.2558% |
| Can reach capture or stalemate | 1,104 | 5.2642% |

8 cyclic components; 3,568 history states and 3,645 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 4 | 13,560 | [Ke7 Kb7 Kd6 Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/3K4/1B1N4/8/8/8/8_w_-_-_0_1&moves=Ke7,Kb7,Kd6,Kc8&cursor=0) |
| 1 | 3,856 | [Kd8 Kb7 Ke7 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/4K3/8/1B1N4/8/8/8/8_w_-_-_0_1&moves=Kd8,Kb7,Ke7,Kb8&cursor=0) |
| 2 | 3,856 | [Kc5 Kb7 Kb4 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/3B4/8/3N4/1K6/8/8/8_w_-_-_0_1&moves=Kc5,Kb7,Kb4,Kb8&cursor=0) |
| 3 | 96 | [Be8 Kd8 Bd7 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2kBN3/4K3/8/8/8/8/8_w_-_-_0_1&moves=Be8,Kd8,Bd7,Kc7&cursor=0) |
| 6 | 80 | [Be8 Kd8 Ba4 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/8/3K1N2/B7/8/8/8_w_-_-_0_1&moves=Be8,Kd8,Ba4,Kc7&cursor=0) |
| 8 | 32 | [Bc6 Ke4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/2KNk3/8/8/8/8_w_-_-_0_1&moves=Bc6,Ke4,Ba8,Ke5&cursor=0) |
| 5 | 8 | [Ba4 Kc7 Bb3 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/4K3/5N2/8/1B6/8/8_w_-_-_0_1&moves=Ba4,Kc7,Bb3,Kd8&cursor=0) |
| 7 | 8 | [Kc5 Kc8 Kd6 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/3K4/1B1N4/8/8/8/8_w_-_-_0_1&moves=Kc5,Kc8,Kd6,Kd8&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| 5-diagonal; interior king; interior bishop; bishop not king-protected; knight king-protected | 24 |
| 5-diagonal; central king; edge bishop; bishop not king-protected; knight not king-protected | 16 |
| 5-diagonal; interior king; edge bishop; bishop not king-protected; knight king-protected | 16 |
| 5-diagonal; interior king; interior bishop; bishop king-protected; knight king-protected | 16 |
| 5-diagonal; interior king; interior bishop; bishop not king-protected; knight not king-protected | 16 |
| 5-diagonal; edge king; interior bishop; bishop not king-protected; knight not king-protected | 8 |
| 7-diagonal; interior king; interior bishop; bishop not king-protected; knight king-protected | 8 |
| unsupported; interior king; edge bishop; bishop not king-protected; knight king-protected | 8 |
| unsupported; interior king; interior bishop; bishop king-protected; knight king-protected | 8 |
