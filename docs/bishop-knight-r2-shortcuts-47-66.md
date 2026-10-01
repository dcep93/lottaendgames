# R2 shortcuts 47–66

Twenty serial single-position r2 changes, continuing from the 46 previously applied shortcuts. Each round recomputed the largest local worst-case saving in White moves to the current r1 graph, considering every selected White tie and every legal Black reply. Alternatives must continue through existing certified routes. This ranks local savings, not the overall maximum across starts. All 99 r1 edges, r1 choices, rule priorities, the immutable seed, and the r4 rules remain unchanged. These changes are uncommitted.

The 20 local savings were thirteen of 3 moves, five of 2 moves, and two of 4 moves. Savings are measured at selection time and are not additive.

## Completed-r4 starts

Exact distributions across the same 82 starting positions; clocks reset to zero. Each observation is the worst case for that start. Moves count White turns, including a move that enters r1. Reaching mate earlier also terminates the bridge. The r2-to-mate metric includes subsequent r1 play.

| Metric | Before mean | After mean | Before median | After median | Before max | After max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| R2 → r1 | 14.46 | 13.98 | 12 | 11 | 28 | 28 |
| R2 → mate | 32.80 | 32.34 | 31 | 30 | 47 | 47 |

Sixteen starts improve their worst-case bridge duration; fourteen improve their worst-case mating duration. None worsen on either metric. All 82 still force mate within 47 White moves from a fresh clock. This does not establish the duration or convergence of arbitrary pre-r2 positions.

| White moves | R2 → r1 starts | R2 → mate starts |
| --- | ---: | ---: |
| 1–5 | 8 | 0 |
| 6–10 | 26 | 0 |
| 11–15 | 20 | 4 |
| 16–20 | 10 | 2 |
| 21–25 | 8 | 2 |
| 26–30 | 10 | 36 |
| 31–35 | 0 | 10 |
| 36–40 | 0 | 14 |
| 41–45 | 0 | 6 |
| 46–50 | 0 | 8 |

## Reachable r2 positions

D4-deduplicated White-to-move r2 positions reached from those starts, counted once per class. This population changes as routes change, so its before/after means describe different populations.

| Metric | Before (547 classes) | After (546 classes) |
| --- | ---: | ---: |
| R2 → r1 mean | 7.86 | 7.54 |
| R2 → mate mean | 23.52 | 23.23 |

## Changes and old worst-case paths

Every link uses a light-square bishop and passes the actual replay decoder and router. Paths include a Black reply where needed for replay compatibility.

| Shortcut | Change / old worst-case path | R2 moves before → after | Saved |
| --- | --- | ---: | ---: |
| 47 | [Be4 → Ng6](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/8/3B1K1k/8/8_w_-_-_0_1&moves=Be4,Kh4,Ng4,Kg5,Bc2,Kh4,Kf4,Kh3,Be4,Kh4&cursor=0) | 5 → 2 | 3 |
| 48 | [Kf2 → Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/4N3/8/8/3B1K2/8/7k_w_-_-_0_1&moves=Kf2,Kh2,Bf5,Kh1,Nf4,Kh2,Ng2,Kh1,Ne3,Kh2&cursor=0) | 5 → 2 | 3 |
| 49 | [Kg3+ → Ne3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N1B3/5K2/8/7k_w_-_-_0_1&moves=Kg3%2B,Kg1,Bd3,Kh1,Ne3,Kg1,Ng2,Kh1,Nf4,Kg1&cursor=0) | 5 → 2 | 3 |
| 50 | [Be4 → Ne2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/3N4/5K2/8/5k2_w_-_-_0_1&moves=Be4,Ke1,Ne2,Kd2,Bg6,Kd1,Ke3,Ke1,Bc2,Kf1&cursor=0) | 5 → 2 | 3 |
| 51 | [Nd4 → Bc2](http://localhost:5173/mate/bishop-knight#fen=8/8/4N3/5B2/8/4K3/8/4k3_w_-_-_0_1&moves=Nd4,Kf1,Be4,Kg1,Ne2%2B,Kh2,Bf5,Kg2,Be6,Kf1&cursor=0) | 5 → 2 | 3 |
| 52 | [Kf3 → Nf4](http://localhost:5173/mate/bishop-knight#fen=8/8/4N3/8/4B3/8/4K3/6k1_w_-_-_0_1&moves=Kf3,Kf1,Nf4,Ke1,Ne2,Kd2,Bg6,Kd1,Ke3,Ke1,Bc2,Kf1&cursor=0) | 6 → 3 | 3 |
| 53 | [Kf3 → Nf4](http://localhost:5173/mate/bishop-knight#fen=8/8/4N3/5B2/8/8/4K3/6k1_w_-_-_0_1&moves=Kf3,Kf1,Nf4,Ke1,Ne2,Kd2,Bg6,Kd1,Ke3,Ke1,Bc2,Kf1&cursor=0) | 6 → 3 | 3 |
| 54 | [Kf3 → Nf4](http://localhost:5173/mate/bishop-knight#fen=8/8/4N3/5B2/8/4K3/8/6k1_w_-_-_0_1&moves=Kf3,Kf1,Nf4,Ke1,Ne2,Kd2,Bg6,Kd1,Ke3,Ke1,Bc2,Kf1&cursor=0) | 6 → 3 | 3 |
| 55 | [Kf3 → Ne5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N1B3/4K3/8/5k2_w_-_-_0_1&moves=Kf3,Ke1,Bd3,Kd1,Kf2,Kc1,Ke3,Kd1,Na3,Kc1,Nc2,Kd1,Be4,Kc1,Kd3,Kd1,Bf3%2B,Kc1,Kc3,Kb1,Bd5,Kc1,Ba2,Kd1&cursor=0) | 12 → 9 | 3 |
| 56 | [Kf2 → Kf3](http://localhost:5173/mate/bishop-knight#fen=8/8/4N3/8/8/3B3k/4K3/8_w_-_-_0_1&moves=Kf2,Kg4,Be4,Kh3,Bf5%2B,Kh4,Kf3,Kh5,Kg3,Kh6,Kf4,Kh5,Nf8,Kh4,Ng6%2B,Kh5,Be4,Kh6,Kf5,Kh5,Bf3%2B,Kh6,Kf6,Kh7,Bd5,Kh6,Bg8,Kh5&cursor=0) | 14 → 11 | 3 |
| 57 | [Kf2 → Kf3](http://localhost:5173/mate/bishop-knight#fen=8/8/4N3/8/8/3BK2k/8/8_w_-_-_0_1&moves=Kf2,Kg4,Be4,Kh3,Bf5%2B,Kh4,Kf3,Kh5,Kg3,Kh6,Kf4,Kh5,Nf8,Kh4,Ng6%2B,Kh5,Be4,Kh6,Kf5,Kh5,Bf3%2B,Kh6,Kf6,Kh7,Bd5,Kh6,Bg8,Kh5&cursor=0) | 14 → 11 | 3 |
| 58 | [Be4 → Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/4N3/7k/8/3BK3/8/8_w_-_-_0_1&moves=Be4,Kg4,Kf2,Kh3,Bf5%2B,Kh4,Kf3,Kh5,Kg3,Kh6,Kf4,Kh5,Nf8,Kh4,Ng6%2B,Kh5,Be4,Kh6,Kf5,Kh5,Bf3%2B,Kh6,Kf6,Kh7,Bd5,Kh6,Bg8,Kh5&cursor=0) | 14 → 11 | 3 |
| 59 | [Be4 → Nd2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/5B2/2N5/4K3/8/4k3_w_-_-_0_1&moves=Be4,Kf1,Ne5,Ke1,Nf3%2B,Kd1,Nd4,Kc1,Kd3,Kb1,Bd5,Kc1,Nc2,Kb2,Be6,Kb1,Kc3,Kc1,Ba2,Kd1&cursor=0) | 10 → 7 | 3 |
| 60 | [Bf5 → Nf4](http://localhost:5173/mate/bishop-knight#fen=8/8/4N3/8/8/3B4/5K1k/8_w_-_-_0_1&moves=Bf5,Kh1,Nf4,Kh2,Ng2,Kh1,Ne3,Kh2&cursor=0) | 4 → 2 | 2 |
| 61 | [Kg3 → Ne3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N5/3B1K2/8/6k1_w_-_-_0_1&moves=Kg3,Kh1,Ne3,Kg1,Ng2,Kh1,Nf4,Kg1&cursor=0) | 4 → 2 | 2 |
| 62 | [Kg3 → Ne3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/4B3/5K2/2N5/6k1_w_-_-_0_1&moves=Kg3,Kf1,Bd3%2B,Kg1,Ne3,Kh1,Ng2,Kg1&cursor=0) | 4 → 2 | 2 |
| 63 | [Ng4 → Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/4B2k/4NK2/8/8_w_-_-_0_1&moves=Ng4,Kg5,Bc2,Kh4,Kf4,Kh3,Be4,Kh4&cursor=0) | 4 → 2 | 2 |
| 64 | [Ne2 → Ke3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3NB3/5K2/8/4k3_w_-_-_0_1&moves=Ne2,Kd2,Bg6,Kd1,Ke3,Ke1,Bc2,Kf1&cursor=0) | 4 → 2 | 2 |
| 65 | [Be4 → Nc6](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3BN3/8/4K3/8/4k3_w_-_-_0_1&moves=Be4,Kd1,Nc4,Kc1,Bd3,Kd1,Na3,Kc1,Nc2,Kd1,Be4,Kc1,Kd3,Kd1,Bf3%2B,Kc1,Kc3,Kb1,Bd5,Kc1,Ba2,Kd1&cursor=0) | 11 → 7 | 4 |
| 66 | [Bd5 → Nc6](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4N3/k2KB3/8/8/8_w_-_-_0_1&moves=Bd5,Kb4,Nd3%2B,Kb5,Ke5,Ka5,Kd6,Kb6,Kd7,Kb5,Kc7,Ka6,Bc4%2B,Ka5,Kc6,Ka4,Kb6,Ka3,Kc5,Ka4,Nc1,Ka3,Nb3,Ka4,Bd5,Ka3,Kc4,Ka4,Bc6%2B,Ka3,Kc3,Ka2,Be4,Ka3,Bb1,Ka4&cursor=0) | 18 → 14 | 4 |

## Verification

Each round verifies the changed choice, preserves all other previously reachable decisions, preserves r1, and rechecks the stage graph. Final exhaustive stage certificate: 697 source classes, 1,574 Black-reply edges, 5,576 D4 checks, 99 reachable r1 edges, zero outside r1 labels, zero cycles, captures, or stalemates. Checkmate retains its higher-priority attribution. Cached runtime enumeration independently reproduces the mate histogram.

Local evidence: `.audit/serial-core-entry-47-66/` contains every search ranking, pre-change snapshot, patch, per-round verification, final certificate, distributions, and validated replay links.
