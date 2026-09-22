# Supported placement after 2. Kd7

The loaded move log is `1. Kd8 Kb7 2. Kd7 Ka7`, starting from `1k6/4K3/8/1B1N4/8/8/8/8 w - - 0 1`. Support is classified immediately after White moves, so this declaration concerns White Kd7, Bb5, Nd5 against Black Kb7, not Black's later a7 square.

That exact resulting placement is now a declared supported five-diagonal, including all rotations and reflections and independent of move counters. It specifically overrides the five-knight king-color restriction. The Bc6 exclusion and other universal support limits remain in force. Nearby placements do not inherit the exception. No r2.5 declaration or rule ordering was changed: existing preferences now select Kd7 once r1.5 accepts it.

All 215 bishop-and-knight tests passed, as did the production build. Coverage checks support and unique ideal selection after Kd8–d7 across eight symmetries and varied counters, plus rejection with Black on a7/b8, a changed knight, or Bc6. The former Kd6–d7 preference against Kb7 also becomes eligible because it reaches the same declared placement.


# Supported-position continuation audit

Policy commit: `2e3d9c1b1f4df1dd56a24fd177865cfb4df072b2`. Fingerprint: `0b48b586fb20137d5c32a80d99b0ef794400b71b4e1a790b79e78e414b6fce3c`.

The full placement census classified 13,660,584 positions and selected **20,980 supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 64 | 0.3051% |
| Not directly on a loop | 20,916 | 99.6949% |
| Can reach a loop | 224 | 1.0677% |
| Cannot reach a loop | 20,756 | 98.9323% |
| Can reach mate | 19,716 | 93.9752% |
| Can reach capture or stalemate | 1,104 | 5.2622% |

5 cyclic components; 3,566 history states and 3,627 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 1 | 96 | [Be8 Kd8 Bd7 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2kBN3/4K3/8/8/8/8/8_w_-_-_0_1&moves=Be8,Kd8,Bd7,Kc7&cursor=0) |
| 3 | 80 | [Be8 Kd8 Ba4 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/8/3K1N2/B7/8/8/8_w_-_-_0_1&moves=Be8,Kd8,Ba4,Kc7&cursor=0) |
| 5 | 32 | [Bc6 Ke4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/2KNk3/8/8/8/8_w_-_-_0_1&moves=Bc6,Ke4,Ba8,Ke5&cursor=0) |
| 2 | 8 | [Ba4 Kc7 Bb3 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/4K3/5N2/8/1B6/8/8_w_-_-_0_1&moves=Ba4,Kc7,Bb3,Kd8&cursor=0) |
| 4 | 8 | [Kc5 Kc8 Kd6 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/3K4/1B1N4/8/8/8/8_w_-_-_0_1&moves=Kc5,Kc8,Kd6,Kd8&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| 5-diagonal; central king; edge bishop; bishop not king-protected; knight not king-protected | 16 |
| 5-diagonal; interior king; edge bishop; bishop not king-protected; knight king-protected | 16 |
| 5-diagonal; interior king; interior bishop; bishop king-protected; knight king-protected | 16 |
| 5-diagonal; interior king; interior bishop; bishop not king-protected; knight king-protected | 8 |
| 7-diagonal; interior king; interior bishop; bishop not king-protected; knight king-protected | 8 |
| unsupported; interior king; edge bishop; bishop not king-protected; knight king-protected | 8 |
| unsupported; interior king; interior bishop; bishop king-protected; knight king-protected | 8 |

## Comparison and loaded witness

Compared with the preceding r2.5 Kd8 audit, supported starts reaching a loop fell from 4,056 to 224 (19.3401% to 1.0677%); directly cyclic starts fell from 88 to 64. Five cyclic components remain, so the loop gate still fails. The fingerprint above includes the uncommitted declaration on top of the stated parent commit.

Loaded the largest component reflected across a8–h1: `8/8/1k6/1B6/1NK5/8/8/8 w - - 0 1`, `1. Ba4 Ka5 2. Bb5 Kb6`. Both laps were checked against production White and Black best-move sets with return history, and replay encoding/decoding passed.
