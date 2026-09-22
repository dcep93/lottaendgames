# Kb5 support independent of the knight

The loaded line starts from `1kB5/8/8/K2N4/8/8/8/8 w - - 0 1`, then `1. Ba6 Ka7 2. Kb5`. The user explicitly declared White Kb5/Ba6 against Black Ka7 supported regardless of knight location.

The classifier now recognizes that king–bishop–king arrangement before knight-placement exclusions, including every rotation and reflection. It returns three-diagonal support even with an edge knight, a remote knight, or a knight otherwise excluded by the same-colored king rule. It does not create a knight support target at Kb5: the knight-distance score remains 99. Existing earlier move-safety and mate priorities still apply; support is a placement classification, not a guarantee against capture or stalemate. No move preferences changed.

Tests enumerate all 61 unoccupied knight squares in every symmetry, check the loaded Kb5 move is uniquely best, and reject nearby arrangements that do not match. Reflected Kd7/Bc8 versus Kb8 and Kg4/Bh3 versus Kh2 are intentionally covered by the same exception. The separate declared unsupported Kg4/Bf1/Ne2 versus Kh2 remains rejected.

All 214 bishop-and-knight rule tests and the production build passed.

# Supported-position continuation audit

Policy commit: `ec08b4c5893a9a6cfb4e3ab58d8a72789e5bc3ca`. Fingerprint: `b3c36c32eac0fc93db8e6ba26ffeddf5bb539fd021fc0c4ff8a54873578bc7aa`.

The full placement census classified 13,660,584 positions and selected **18,280 supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 224 | 1.2254% |
| Not directly on a loop | 18,056 | 98.7746% |
| Can reach a loop | 224 | 1.2254% |
| Cannot reach a loop | 18,056 | 98.7746% |
| Can reach mate | 17,232 | 94.2670% |
| Can reach capture or stalemate | 840 | 4.5952% |

27 cyclic components; 2,983 history states and 3,016 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 1 | 16 | [Bd2 Kb3 Be3 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/3N4/8/8/4B3/1k6/3K4_w_-_-_0_1&moves=Bd2,Kb3,Be3,Kb2&cursor=0) |
| 2 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/7B/7k/4N3_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 3 | 8 | [Kg4 Kh1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/7B/4N2k/8_w_-_-_0_1&moves=Kg4,Kh1,Kf4,Kh2&cursor=0) |
| 4 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=4N3/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 5 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/7B/7k/3N4_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 6 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=3N4/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 7 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/7B/7k/2N5_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 8 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=2N5/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 9 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/7B/7k/1N6_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 10 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=1N6/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 11 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/7B/7k/N7_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 12 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/7B/N6k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 13 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/N6B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 14 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/N4K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 15 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/N7/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 16 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/N7/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 17 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/N7/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 18 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=N7/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 19 | 8 | [Kg4 Kh1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/7N/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kh1,Kf4,Kh2&cursor=0) |
| 20 | 8 | [Kg4 Kh1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=7N/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kh1,Kf4,Kh2&cursor=0) |
| 21 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K1N/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 22 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/7N/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 23 | 8 | [Kg4 Kh1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/7N/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kh1,Kf4,Kh2&cursor=0) |
| 24 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/6NB/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 25 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=6N1/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 26 | 8 | [Kg4 Kg1 Kf3 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/5K1B/5N1k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf3,Kh2&cursor=0) |
| 27 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=5N2/8/8/8/5K2/7B/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| unsupported; interior king; edge bishop; bishop not king-protected; knight not king-protected | 192 |
| 3-diagonal; interior king; edge bishop; bishop king-protected; knight not king-protected | 184 |
| 3-diagonal; interior king; edge bishop; bishop king-protected; knight king-protected | 24 |
| unsupported; interior king; edge bishop; bishop not king-protected; knight king-protected | 16 |
| 5-diagonal; edge king; interior bishop; bishop king-protected; knight not king-protected | 8 |
| 7-diagonal; edge king; interior bishop; bishop not king-protected; knight not king-protected | 8 |

## Comparison and loaded witness

The supported-start population grows from 17,792 to 18,280. Directly cyclic supported starts increase from 32 to 224; starts reaching loops increase from 40 to 224. There are now 27 cyclic components, so the loop gate still fails. Twenty-six components share a corner king-shuttle motif with different knight placements (208 physical supported starts); the remaining component has 16. This expansion does not justify silently undoing the user's declaration or adding new preferences. The fingerprint includes this change on top of the parent commit above.

Loaded a representative new shuttle with an interior knight: `8/k2N4/B7/2K5/8/8/8/8 w - - 0 1`, `1. Kb5 Ka8 2. Kc5 Ka7`. Both laps were checked against production White and Black best-move sets with return history. Replay round-trip passed; the initial board is loaded in the sidebar with Redo enabled.
