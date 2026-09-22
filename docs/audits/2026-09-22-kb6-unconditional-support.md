# Unconditional Ba6/Kb6 support

User declaration: bishop on a6 and White king on b6 is supported no matter what.

The classifier now recognizes this pair before the general support restrictions, including all eight board symmetries. Neither the knight placement nor Black's location restricts this exception. This bypasses the edge-knight, support-square, race and king-distance restrictions for the declared pair only. Classification remains post-White and requires all four pieces to exist. The real c6/d7 knight targets remain available for ranking moves; the declaration does not add a move prescription.

Regression coverage exhausts all nonoverlapping knight squares and all Black squares not adjacent to White's king for every symmetry. It also checks that the knight-target distance remains available and that 2. Kb6 is uniquely preferred from the prior loop with Ba6/Na5/Kb5 versus Kb8. Two older tests now recognize the new unconditional exception.

## Verification

All 216 bishop-knight rule tests pass, as does the production build. The exhaustive audit scanned 13,660,584 placements with four workers and followed continuations through loss of support.

Compared with the prior audit, supported starts increased from 18,288 to 44,584. Directly looping starts increased from 216 to 960 (2.1532% of the new supported census); starts able to reach a loop increased from 216 to 24,656 (55.3024%). Cyclic components increased from 26 to 110. The expanded declaration admits positions with Black far from the corner; it does not ensure convergence to mate.

Loaded the dominant component's minimal loop, [1. Nc6+ Ke4 2. Na5 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/BK6/N3k3/8/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ke4,Na5,Ke5&cursor=0). Verified every move over two laps against the production best-move policy and Black return history, plus successful replay decoding and enabled Redo in the browser. 7,384 selected starts can reach this component.

The report identifies the parent commit; its fingerprint includes this commit's production changes. The loop gate remains failing because loops remain.

---

# Supported-position continuation audit

Policy commit: `3bd9882e571e7ee0cf6f662ca814f5acdc3c1a67`. Fingerprint: `72b2447653b76a0fc7e4033e4d433ad6850f6bd852563a988c1fbd69c3248bcd`.

The full placement census classified 13,660,584 positions and selected **44,584 supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Selected starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 960 | 2.1532% |
| Not directly on a loop | 43,624 | 97.8468% |
| Can reach a loop | 24,656 | 55.3024% |
| Cannot reach a loop | 19,928 | 44.6976% |
| Can reach mate | 16,656 | 37.3587% |
| Can reach capture or stalemate | 3,336 | 7.4825% |

110 cyclic components; 6,472 history states and 6,720 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Representative loops

| Component | Selected starts reaching it | Replay |
|---|---:|---|
| 14 | 7,384 | [Nc6+ Ke4 Na5 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/BK6/N3k3/8/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ke4,Na5,Ke5&cursor=0) |
| 15 | 5,936 | [Nd1 Ke5 Nc3 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3k4/2N5/2K5/2B5_w_-_-_0_1&moves=Nd1,Ke5,Nc3,Kd4&cursor=0) |
| 57 | 2,464 | [Nc5 Ke5 Nd7+ Kd6](http://localhost:5173/mate/bishop-knight#fen=8/3N4/BK1k4/8/8/8/8/8_w_-_-_0_1&moves=Nc5,Ke5,Nd7%2B,Kd6&cursor=0) |
| 55 | 1,696 | [Ne2 Ke4 Nf4 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4k3/5N2/6KB/8/8_w_-_-_0_1&moves=Ne2,Ke4,Nf4,Ke5&cursor=0) |
| 37 | 808 | [Nh4 Kd5 Nf3 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/3k4/8/8/5NKB/8/8_w_-_-_0_1&moves=Nh4,Kd5,Nf3,Kd6&cursor=0) |
| 58 | 800 | [Ne2 Ke5 Nf4 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/3k4/8/5N2/6KB/8/8_w_-_-_0_1&moves=Ne2,Ke5,Nf4,Kd6&cursor=0) |
| 35 | 696 | [Nh4 Kd6 Nf3 Ke7](http://localhost:5173/mate/bishop-knight#fen=8/4k3/8/8/8/5NKB/8/8_w_-_-_0_1&moves=Nh4,Kd6,Nf3,Ke7&cursor=0) |
| 60 | 608 | [Nd7 Ke4 Nc5+ Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/BK6/2N5/5k2/8/8/8_w_-_-_0_1&moves=Nd7,Ke4,Nc5%2B,Kf4&cursor=0) |
| 85 | 568 | [Nd3+ Ke4 Nb4 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4k3/1N6/8/2K5/2B5_w_-_-_0_1&moves=Nd3%2B,Ke4,Nb4,Ke5&cursor=0) |
| 86 | 568 | [Nd3+ Kd5 Nb4+ Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4k3/1N6/8/2K5/2B5_w_-_-_0_1&moves=Nd3%2B,Kd5,Nb4%2B,Ke5&cursor=0) |
| 43 | 544 | [Na5 Ke4 Nc6 Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/BKN5/8/5k2/8/8/8_w_-_-_0_1&moves=Na5,Ke4,Nc6,Kf4&cursor=0) |
| 56 | 488 | [Ne2 Kd6 Nf4 Ke7](http://localhost:5173/mate/bishop-knight#fen=8/4k3/8/8/5N2/6KB/8/8_w_-_-_0_1&moves=Ne2,Kd6,Nf4,Ke7&cursor=0) |
| 81 | 456 | [Nf4 Kd4 Ne2+ Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4k3/8/6KB/4N3/8_w_-_-_0_1&moves=Nf4,Kd4,Ne2%2B,Ke5&cursor=0) |
| 84 | 448 | [Nc5+ Ke5 Nd7+ Ke6](http://localhost:5173/mate/bishop-knight#fen=8/3N4/BK2k3/8/8/8/8/8_w_-_-_0_1&moves=Nc5%2B,Ke5,Nd7%2B,Ke6&cursor=0) |
| 32 | 408 | [Nh2 Ke5 Nf3+ Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/8/5NKB/8/8_w_-_-_0_1&moves=Nh2,Ke5,Nf3%2B,Kf6&cursor=0) |
| 39 | 408 | [Na5 Ke4 Nc6 Kf5](http://localhost:5173/mate/bishop-knight#fen=8/8/BKN5/5k2/8/8/8/8_w_-_-_0_1&moves=Na5,Ke4,Nc6,Kf5&cursor=0) |
| 36 | 384 | [Na5 Ke5 Nc6+ Ke6](http://localhost:5173/mate/bishop-knight#fen=8/8/BKN1k3/8/8/8/8/8_w_-_-_0_1&moves=Na5,Ke5,Nc6%2B,Ke6&cursor=0) |
| 83 | 344 | [Nf4 Ke5 Ne2 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/3k4/8/8/6KB/4N3/8_w_-_-_0_1&moves=Nf4,Ke5,Ne2,Kd6&cursor=0) |
| 53 | 328 | [Ne2 Ke5 Nf4 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/5N2/6KB/8/8_w_-_-_0_1&moves=Ne2,Ke5,Nf4,Kf6&cursor=0) |
| 80 | 312 | [Nd3 Kd5 Nb4+ Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/1N1k4/8/2K5/2B5_w_-_-_0_1&moves=Nd3,Kd5,Nb4%2B,Kd4&cursor=0) |
| 59 | 176 | [Nd7+ Ke7 Nc5 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/BK3k2/2N5/8/8/8/8_w_-_-_0_1&moves=Nd7%2B,Ke7,Nc5,Kf6&cursor=0) |
| 16 | 144 | [Nf3 Kd5 Nh4 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/3k4/8/7N/6KB/8/8_w_-_-_0_1&moves=Nf3,Kd5,Nh4,Kd6&cursor=0) |
| 64 | 144 | [Nd7 Ke6 Nc5+ Kf5](http://localhost:5173/mate/bishop-knight#fen=8/8/BK6/2N2k2/8/8/8/8_w_-_-_0_1&moves=Nd7,Ke6,Nc5%2B,Kf5&cursor=0) |
| 38 | 136 | [Na5 Ke6 Nc6 Kf7](http://localhost:5173/mate/bishop-knight#fen=8/5k2/BKN5/8/8/8/8/8_w_-_-_0_1&moves=Na5,Ke6,Nc6,Kf7&cursor=0) |
| 13 | 128 | [Nc6 Kd5 Na5 Ke6](http://localhost:5173/mate/bishop-knight#fen=8/8/BK2k3/N7/8/8/8/8_w_-_-_0_1&moves=Nc6,Kd5,Na5,Ke6&cursor=0) |
| 89 | 128 | [Nc5 Kf6 Nd7+ Kf7](http://localhost:5173/mate/bishop-knight#fen=8/3N1k2/BK6/8/8/8/8/8_w_-_-_0_1&moves=Nc5,Kf6,Nd7%2B,Kf7&cursor=0) |
| 65 | 112 | [Nb4 Ke5 Nd3+ Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/8/3N4/2K5/2B5_w_-_-_0_1&moves=Nb4,Ke5,Nd3%2B,Kf6&cursor=0) |
| 34 | 96 | [Na5 Ke6 Nc6 Kd7](http://localhost:5173/mate/bishop-knight#fen=8/3k4/BKN5/8/8/8/8/8_w_-_-_0_1&moves=Na5,Ke6,Nc6,Kd7&cursor=0) |
| 42 | 96 | [Na5 Ke5 Nc6+ Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/BKN2k2/8/8/8/8/8_w_-_-_0_1&moves=Na5,Ke5,Nc6%2B,Kf6&cursor=0) |
| 90 | 96 | [Nc5 Ke5 Nd7+ Kf5](http://localhost:5173/mate/bishop-knight#fen=8/3N4/BK6/5k2/8/8/8/8_w_-_-_0_1&moves=Nc5,Ke5,Nd7%2B,Kf5&cursor=0) |
| 91 | 96 | [Nc5 Ke5 Nd7+ Kf4](http://localhost:5173/mate/bishop-knight#fen=8/3N4/BK6/8/5k2/8/8/8_w_-_-_0_1&moves=Nc5,Ke5,Nd7%2B,Kf4&cursor=0) |
| 78 | 88 | [Nf4 Ke5 Ne2 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/8/6KB/4N3/8_w_-_-_0_1&moves=Nf4,Ke5,Ne2,Kf6&cursor=0) |
| 102 | 88 | [Nf1 Ke4 Nh2 Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/BK6/8/5k2/8/7N/8_w_-_-_0_1&moves=Nf1,Ke4,Nh2,Kf4&cursor=0) |
| 10 | 64 | [Nf3+ Kd5 Nh4 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4k3/7N/6KB/8/8_w_-_-_0_1&moves=Nf3%2B,Kd5,Nh4,Ke5&cursor=0) |
| 22 | 64 | [Nc6 Ke4 Na5 Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/BK6/N7/5k2/8/8/8_w_-_-_0_1&moves=Nc6,Ke4,Na5,Kf4&cursor=0) |
| 44 | 64 | [Nd1 Ke5 Nc3 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/8/2N5/2K5/2B5_w_-_-_0_1&moves=Nd1,Ke5,Nc3,Kf6&cursor=0) |
| 104 | 64 | [Na4 Kd4 Nb6 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/1N6/4k3/8/6KB/8/8_w_-_-_0_1&moves=Na4,Kd4,Nb6,Ke5&cursor=0) |
| 62 | 56 | [Ne2 Kd6 Nf4 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/8/8/5N2/6KB/8/8_w_-_-_0_1&moves=Ne2,Kd6,Nf4,Kc7&cursor=0) |
| 7 | 48 | [Nf3 Ke7 Nh4 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/7N/6KB/8/8_w_-_-_0_1&moves=Nf3,Ke7,Nh4,Kf6&cursor=0) |
| 11 | 48 | [Nf3 Kd6 Nh4 Ke7](http://localhost:5173/mate/bishop-knight#fen=8/4k3/8/8/7N/6KB/8/8_w_-_-_0_1&moves=Nf3,Kd6,Nh4,Ke7&cursor=0) |
| 61 | 48 | [Ne2 Ke7 Nf4 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/8/8/5N2/6KB/8/8_w_-_-_0_1&moves=Ne2,Ke7,Nf4,Kd8&cursor=0) |
| 82 | 48 | [Nf4 Kd6 Ne2 Ke7](http://localhost:5173/mate/bishop-knight#fen=8/4k3/8/8/8/6KB/4N3/8_w_-_-_0_1&moves=Nf4,Kd6,Ne2,Ke7&cursor=0) |
| 96 | 48 | [Nc5 Kf4 Nd7 Kg5](http://localhost:5173/mate/bishop-knight#fen=8/3N4/BK6/6k1/8/8/8/8_w_-_-_0_1&moves=Nc5,Kf4,Nd7,Kg5&cursor=0) |
| 52 | 40 | [Ne2 Kf6 Nf4 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/8/8/5N2/6KB/8/8_w_-_-_0_1&moves=Ne2,Kf6,Nf4,Kg7&cursor=0) |
| 69 | 40 | [Nd7 Kf5 Nc5 Kg4](http://localhost:5173/mate/bishop-knight#fen=8/8/BK6/2N5/6k1/8/8/8_w_-_-_0_1&moves=Nd7,Kf5,Nc5,Kg4&cursor=0) |
| 5 | 32 | [Na7 Ka8 Nb5 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/BK6/1N6/8/8/8/8_w_-_-_0_1&moves=Na7,Ka8,Nb5,Kb8&cursor=0) |
| 48 | 32 | [Na5 Kf4 Nc6 Kg4](http://localhost:5173/mate/bishop-knight#fen=8/8/BKN5/8/6k1/8/8/8_w_-_-_0_1&moves=Na5,Kf4,Nc6,Kg4&cursor=0) |
| 51 | 32 | [Ne2 Kf6 Nf4 Kg5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/6k1/5N2/6KB/8/8_w_-_-_0_1&moves=Ne2,Kf6,Nf4,Kg5&cursor=0) |
| 12 | 24 | [Nc6+ Ke6 Na5 Ke7](http://localhost:5173/mate/bishop-knight#fen=8/4k3/BK6/N7/8/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ke6,Na5,Ke7&cursor=0) |
| 27 | 24 | [Nc6 Kf4 Na5 Kg4](http://localhost:5173/mate/bishop-knight#fen=8/8/BK6/N7/6k1/8/8/8_w_-_-_0_1&moves=Nc6,Kf4,Na5,Kg4&cursor=0) |
| 30 | 24 | [Nh2 Kf6 Nf3 Kg6](http://localhost:5173/mate/bishop-knight#fen=8/8/6k1/8/8/5NKB/8/8_w_-_-_0_1&moves=Nh2,Kf6,Nf3,Kg6&cursor=0) |
| 92 | 24 | [Nd3 Kf5 Nb4 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/1N6/8/2K5/2B5_w_-_-_0_1&moves=Nd3,Kf5,Nb4,Kf6&cursor=0) |
| 93 | 24 | [Nd3 Ke6 Nb4 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/1N6/8/2K5/2B5_w_-_-_0_1&moves=Nd3,Ke6,Nb4,Kf6&cursor=0) |
| 94 | 24 | [Nc5 Kf6 Nd7+ Kg7](http://localhost:5173/mate/bishop-knight#fen=8/3N2k1/BK6/8/8/8/8/8_w_-_-_0_1&moves=Nc5,Kf6,Nd7%2B,Kg7&cursor=0) |
| 1 | 16 | [Bd2 Kb3 Be3 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/3N4/8/8/4B3/1k6/3K4_w_-_-_0_1&moves=Bd2,Kb3,Be3,Kb2&cursor=0) |
| 2 | 16 | [Nf3+ Kf6 Nh2 Kg5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/6k1/8/6KB/7N/8_w_-_-_0_1&moves=Nf3%2B,Kf6,Nh2,Kg5&cursor=0) |
| 6 | 16 | [Nc5+ Kd8 Nb7+ Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/1N6/BK6/8/8/8/8/8_w_-_-_0_1&moves=Nc5%2B,Kd8,Nb7%2B,Kc8&cursor=0) |
| 8 | 16 | [Nf3 Ke7 Nh4 Kf7](http://localhost:5173/mate/bishop-knight#fen=8/5k2/8/8/7N/6KB/8/8_w_-_-_0_1&moves=Nf3,Ke7,Nh4,Kf7&cursor=0) |
| 18 | 16 | [Nf3 Kd6 Nh4 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/8/8/7N/6KB/8/8_w_-_-_0_1&moves=Nf3,Kd6,Nh4,Kc7&cursor=0) |
| 20 | 16 | [Nc6 Kf5 Na5 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/BK3k2/N7/8/8/8/8_w_-_-_0_1&moves=Nc6,Kf5,Na5,Kf6&cursor=0) |
| 21 | 16 | [Nc6 Ke4 Na5 Kf5](http://localhost:5173/mate/bishop-knight#fen=8/8/BK6/N4k2/8/8/8/8_w_-_-_0_1&moves=Nc6,Ke4,Na5,Kf5&cursor=0) |
| 23 | 16 | [Nc3 Ke5 Nd1 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/8/8/2K5/2BN4_w_-_-_0_1&moves=Nc3,Ke5,Nd1,Kf6&cursor=0) |
| 41 | 16 | [Nh4 Kd6 Nf3 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/8/8/8/5NKB/8/8_w_-_-_0_1&moves=Nh4,Kd6,Nf3,Kc7&cursor=0) |
| 54 | 16 | [Ne2 Ke7 Nf4 Kf7](http://localhost:5173/mate/bishop-knight#fen=8/5k2/8/8/5N2/6KB/8/8_w_-_-_0_1&moves=Ne2,Ke7,Nf4,Kf7&cursor=0) |
| 63 | 16 | [Nd7 Ke7 Nc5 Kf7](http://localhost:5173/mate/bishop-knight#fen=8/5k2/BK6/2N5/8/8/8/8_w_-_-_0_1&moves=Nd7,Ke7,Nc5,Kf7&cursor=0) |
| 67 | 16 | [Nd7 Kf7 Nc5 Kg6](http://localhost:5173/mate/bishop-knight#fen=8/8/BK4k1/2N5/8/8/8/8_w_-_-_0_1&moves=Nd7,Kf7,Nc5,Kg6&cursor=0) |
| 72 | 16 | [Ng5 Ke5 Nh3 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3k4/7N/2K5/2B5_w_-_-_0_1&moves=Ng5,Ke5,Nh3,Kd4&cursor=0) |
| 75 | 16 | [Nf4 Kf6 Ne2 Kg5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/6k1/8/6KB/4N3/8_w_-_-_0_1&moves=Nf4,Kf6,Ne2,Kg5&cursor=0) |
| 88 | 16 | [Nf4 Kd6 Ne2 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/8/8/8/6KB/4N3/8_w_-_-_0_1&moves=Nf4,Kd6,Ne2,Kc7&cursor=0) |
| 100 | 16 | [Nf3 Kd5 Nd2 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/BK1k4/8/8/8/3N4/8_w_-_-_0_1&moves=Nf3,Kd5,Nd2,Kd6&cursor=0) |
| 3 | 8 | [Nf3 Kf6 Nh2 Kg6](http://localhost:5173/mate/bishop-knight#fen=8/8/6k1/8/8/6KB/7N/8_w_-_-_0_1&moves=Nf3,Kf6,Nh2,Kg6&cursor=0) |
| 4 | 8 | [Nf3 Kf6 Nh2 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/8/8/8/6KB/7N/8_w_-_-_0_1&moves=Nf3,Kf6,Nh2,Kg7&cursor=0) |
| 9 | 8 | [Nc6 Ke6 Na5 Kd7](http://localhost:5173/mate/bishop-knight#fen=8/3k4/BK6/N7/8/8/8/8_w_-_-_0_1&moves=Nc6,Ke6,Na5,Kd7&cursor=0) |
| 17 | 8 | [Nf3 Ke7 Nh4 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/8/8/7N/6KB/8/8_w_-_-_0_1&moves=Nf3,Ke7,Nh4,Kd8&cursor=0) |
| 19 | 8 | [Nc6 Ke6 Na5 Kf7](http://localhost:5173/mate/bishop-knight#fen=8/5k2/BK6/N7/8/8/8/8_w_-_-_0_1&moves=Nc6,Ke6,Na5,Kf7&cursor=0) |
| 24 | 8 | [Nc6 Kf6 Na5 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/BK6/N7/8/8/8/8_w_-_-_0_1&moves=Nc6,Kf6,Na5,Kg7&cursor=0) |
| 25 | 8 | [Nc6 Kf5 Na5 Kg6](http://localhost:5173/mate/bishop-knight#fen=8/8/BK4k1/N7/8/8/8/8_w_-_-_0_1&moves=Nc6,Kf5,Na5,Kg6&cursor=0) |
| 26 | 8 | [Nc6 Kf4 Na5 Kg5](http://localhost:5173/mate/bishop-knight#fen=8/8/BK6/N5k1/8/8/8/8_w_-_-_0_1&moves=Nc6,Kf4,Na5,Kg5&cursor=0) |
| 28 | 8 | [Nc6 Kf4 Na5 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/BK6/N7/8/6k1/8/8_w_-_-_0_1&moves=Nc6,Kf4,Na5,Kg3&cursor=0) |
| 29 | 8 | [Nc3 Kf6 Nd1 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/8/8/8/8/2K5/2BN4_w_-_-_0_1&moves=Nc3,Kf6,Nd1,Kg7&cursor=0) |
| 31 | 8 | [Nh4 Kf6 Nf3 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/8/8/8/5NKB/8/8_w_-_-_0_1&moves=Nh4,Kf6,Nf3,Kg7&cursor=0) |
| 33 | 8 | [Nh4 Ke7 Nf3 Kf7](http://localhost:5173/mate/bishop-knight#fen=8/5k2/8/8/8/5NKB/8/8_w_-_-_0_1&moves=Nh4,Ke7,Nf3,Kf7&cursor=0) |
| 40 | 8 | [Nh4 Ke7 Nf3 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/8/8/8/5NKB/8/8_w_-_-_0_1&moves=Nh4,Ke7,Nf3,Kd8&cursor=0) |
| 45 | 8 | [Na5 Kf6 Nc6 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/BKN5/8/8/8/8/8_w_-_-_0_1&moves=Na5,Kf6,Nc6,Kg7&cursor=0) |
| 46 | 8 | [Na5 Kf5 Nc6 Kg6](http://localhost:5173/mate/bishop-knight#fen=8/8/BKN3k1/8/8/8/8/8_w_-_-_0_1&moves=Na5,Kf5,Nc6,Kg6&cursor=0) |
| 47 | 8 | [Na5 Kf4 Nc6 Kg5](http://localhost:5173/mate/bishop-knight#fen=8/8/BKN5/6k1/8/8/8/8_w_-_-_0_1&moves=Na5,Kf4,Nc6,Kg5&cursor=0) |
| 49 | 8 | [Na5 Kf4 Nc6 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/BKN5/8/8/6k1/8/8_w_-_-_0_1&moves=Na5,Kf4,Nc6,Kg3&cursor=0) |
| 50 | 8 | [Nd1 Kf6 Nc3 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/8/8/8/2N5/2K5/2B5_w_-_-_0_1&moves=Nd1,Kf6,Nc3,Kg7&cursor=0) |
| 66 | 8 | [Nd7 Kf7 Nc5 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/BK6/2N5/8/8/8/8_w_-_-_0_1&moves=Nd7,Kf7,Nc5,Kg7&cursor=0) |
| 68 | 8 | [Nd7 Kf5 Nc5 Kg5](http://localhost:5173/mate/bishop-knight#fen=8/8/BK6/2N3k1/8/8/8/8_w_-_-_0_1&moves=Nd7,Kf5,Nc5,Kg5&cursor=0) |
| 70 | 8 | [Nd7 Kf4 Nc5 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/BK6/2N5/8/6k1/8/8_w_-_-_0_1&moves=Nd7,Kf4,Nc5,Kg3&cursor=0) |
| 71 | 8 | [Nb4 Kf6 Nd3 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/8/8/8/3N4/2K5/2B5_w_-_-_0_1&moves=Nb4,Kf6,Nd3,Kg7&cursor=0) |
| 73 | 8 | [Ne2 Ke4 Nc1 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/BK6/4k3/8/8/8/2N5_w_-_-_0_1&moves=Ne2,Ke4,Nc1,Ke5&cursor=0) |
| 74 | 8 | [Ne2 Ke4 Nc1 Kf5](http://localhost:5173/mate/bishop-knight#fen=8/8/BK6/5k2/8/8/8/2N5_w_-_-_0_1&moves=Ne2,Ke4,Nc1,Kf5&cursor=0) |
| 76 | 8 | [Nf4+ Kf6 Ne2 Kg6](http://localhost:5173/mate/bishop-knight#fen=8/8/6k1/8/8/6KB/4N3/8_w_-_-_0_1&moves=Nf4%2B,Kf6,Ne2,Kg6&cursor=0) |
| 77 | 8 | [Nf4 Kf6 Ne2 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/8/8/8/6KB/4N3/8_w_-_-_0_1&moves=Nf4,Kf6,Ne2,Kg7&cursor=0) |
| 79 | 8 | [Nf4 Ke7 Ne2 Kf7](http://localhost:5173/mate/bishop-knight#fen=8/5k2/8/8/8/6KB/4N3/8_w_-_-_0_1&moves=Nf4,Ke7,Ne2,Kf7&cursor=0) |
| 87 | 8 | [Nf4 Ke7 Ne2 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/8/8/8/6KB/4N3/8_w_-_-_0_1&moves=Nf4,Ke7,Ne2,Kd8&cursor=0) |
| 95 | 8 | [Nc5 Kf5 Nd7 Kg6](http://localhost:5173/mate/bishop-knight#fen=8/3N4/BK4k1/8/8/8/8/8_w_-_-_0_1&moves=Nc5,Kf5,Nd7,Kg6&cursor=0) |
| 97 | 8 | [Nc5 Kf4 Nd7 Kg4](http://localhost:5173/mate/bishop-knight#fen=8/3N4/BK6/8/6k1/8/8/8_w_-_-_0_1&moves=Nc5,Kf4,Nd7,Kg4&cursor=0) |
| 98 | 8 | [Nc5 Kf4 Nd7 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/3N4/BK6/8/8/6k1/8/8_w_-_-_0_1&moves=Nc5,Kf4,Nd7,Kg3&cursor=0) |
| 99 | 8 | [Nd3 Kf6 Nb4 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/8/8/1N6/8/2K5/2B5_w_-_-_0_1&moves=Nd3,Kf6,Nb4,Kg7&cursor=0) |
| 101 | 8 | [Nf7 Kd5 Ng5 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/6N1/3k4/8/2K5/2B5_w_-_-_0_1&moves=Nf7,Kd5,Ng5,Kd4&cursor=0) |
| 103 | 8 | [Nf3 Kd5 Ng5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/BK1k4/6N1/8/8/8/8_w_-_-_0_1&moves=Nf3,Kd5,Ng5,Kd6&cursor=0) |
| 105 | 8 | [Nf6+ Ke6 Nh5 Kd7](http://localhost:5173/mate/bishop-knight#fen=8/3k4/BK6/7N/8/8/8/8_w_-_-_0_1&moves=Nf6%2B,Ke6,Nh5,Kd7&cursor=0) |
| 106 | 8 | [Nc6+ Kc5 Nd8 Kd4](http://localhost:5173/mate/bishop-knight#fen=3N4/8/8/8/3k4/8/2K5/2B5_w_-_-_0_1&moves=Nc6%2B,Kc5,Nd8,Kd4&cursor=0) |
| 107 | 8 | [Bb2+ Kf8 Bc1 Kg7](http://localhost:5173/mate/bishop-knight#fen=7N/6k1/8/8/8/8/2K5/2B5_w_-_-_0_1&moves=Bb2%2B,Kf8,Bc1,Kg7&cursor=0) |
| 108 | 8 | [Bb2+ Kh6 Bc1+ Kg7](http://localhost:5173/mate/bishop-knight#fen=7N/6k1/8/8/8/8/2K5/2B5_w_-_-_0_1&moves=Bb2%2B,Kh6,Bc1%2B,Kg7&cursor=0) |
| 109 | 8 | [Kg4 Kg1 Kf4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5K2/6NB/7k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf4,Kh2&cursor=0) |
| 110 | 8 | [Kg4 Kg1 Kf3 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/5K1B/5N1k/8_w_-_-_0_1&moves=Kg4,Kg1,Kf3,Kh2&cursor=0) |

## Actual downstream piece-position motifs

These counts include every board on a reachable cycle, including smaller diagonals and unsupported boards. Boards are deduplicated across components.

| Placement motif | Physical positions |
|---|---:|
| 3-diagonal; interior king; edge bishop; bishop king-protected; knight king-protected | 632 |
| 3-diagonal; interior king; edge bishop; bishop king-protected; knight not king-protected | 312 |
| unsupported; interior king; edge bishop; bishop not king-protected; knight king-protected | 16 |
| 5-diagonal; edge king; interior bishop; bishop king-protected; knight not king-protected | 8 |
| 7-diagonal; edge king; interior bishop; bishop not king-protected; knight not king-protected | 8 |
| unsupported; interior king; interior bishop; bishop king-protected; knight not king-protected | 8 |
