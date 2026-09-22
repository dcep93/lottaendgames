# Declared support after 2. Nf6

The loaded move log is `1. Kb5 Ka8 2. Nf6 Kb8`, starting from `8/k2N4/B7/2K5/8/8/8/8 w - - 0 1`. The declaration concerns the position immediately after White's Nf6: White Kb5/Ba6/Nf6 against Black Ka8, before the later Kb8 reply.

Added this exact result to the explicit corner-support exceptions, including all eight symmetries and independent of move counters. It bypasses the absent three-diagonal knight target and same-color/off-support restriction for that exact placement. It does not create a target at Kb5 or change move preferences: the knight-distance score remains 99. The prior Kb5/Ba6 versus Ka7 exception remains independent of the knight. Nearby positions, including Black on b8, do not inherit this new exception.

Regression coverage checks support and unique ideal Nf6 selection across every symmetry and varied counters, plus nearby exclusions. A reflected existing target-availability test now recognizes its exact Nc3 declaration while retaining the absent-target score.

## Verification and comparison

All 215 rule tests and the production build pass. The exhaustive supported-position audit completed with four workers, following all best-move branches through loss of support. Its loop gate remains failing because loops remain.

Compared with the previous audit, supported starts increased from 18,280 to 18,288; starts directly on or able to reach a loop fell from 224 to 216; cyclic components fell from 27 to 26. Capture/stalemate reachability remains 840. This is not a proof of forced mate against arbitrary legal defense.

Loaded the next normalized minimal loop: [1. Kb5 Kb8 2. Kc5 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/B7/N1K5/8/8/8/8_w_-_-_0_1&moves=Kb5,Kb8,Kc5,Ka7&cursor=0). Every move was checked against the production best-move policy over two laps, including Black return history; replay decoding succeeds and Redo is enabled in the loaded browser.

The report below identifies the parent commit; its fingerprint includes the uncommitted production changes in this commit.

---

# Supported-position continuation audit

Policy commit: `3341e30e32b1f7943c980f0fa0350a50697d8aeb`. Fingerprint: `c23231a5f3504a1d718f44b474da6aab935a2e078c3a2d32ae534bb960eb4edb`.

The full placement census classified 13,660,584 positions and selected **18,288 supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 216 | 1.1811% |
| Not directly on a loop | 18,072 | 98.8189% |
| Can reach a loop | 216 | 1.1811% |
| Cannot reach a loop | 18,072 | 98.8189% |
| Can reach mate | 17,248 | 94.3132% |
| Can reach capture or stalemate | 840 | 4.5932% |

26 cyclic components; 2,982 history states and 3,015 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 1 | 16 | [Bd2 Kb3 Be3 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/3N4/8/8/4B3/1k6/3K4_w_-_-_0_1&moves=Bd2,Kb3,Be3,Kb2&cursor=0) |
| 2 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K1N/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 3 | 8 | [Kg4 Kh1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/7N/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kh1,Kf4,Kh2&cursor=0) |
| 4 | 8 | [Kg4 Kh1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=7N/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kh1,Kf4,Kh2&cursor=0) |
| 5 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/7N/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 6 | 8 | [Kg4 Kh1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/7N/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kh1,Kf4,Kh2&cursor=0) |
| 7 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/6NB/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 8 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=6N1/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 9 | 8 | [Kg4 Kg1 Kf3 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/5K1B/5N1k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf3,Kh2&cursor=0) |
| 10 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=5N2/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 11 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/7B/7k/4N3_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 12 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=4N3/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 13 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/7B/7k/3N4_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 14 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=3N4/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 15 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/7B/7k/2N5_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 16 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=2N5/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 17 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/7B/7k/1N6_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 18 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=1N6/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 19 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/7B/7k/N7_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 20 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/7B/N6k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 21 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/N6B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 22 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/N4K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 23 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/N7/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 24 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/N7/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 25 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/N7/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 26 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=N7/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| unsupported; interior king; edge bishop; bishop not king-protected; knight not king-protected | 184 |
| 3-diagonal; interior king; edge bishop; bishop king-protected; knight not king-protected | 176 |
| 3-diagonal; interior king; edge bishop; bishop king-protected; knight king-protected | 24 |
| unsupported; interior king; edge bishop; bishop not king-protected; knight king-protected | 16 |
| 5-diagonal; edge king; interior bishop; bishop king-protected; knight not king-protected | 8 |
| 7-diagonal; edge king; interior bishop; bishop not king-protected; knight not king-protected | 8 |
