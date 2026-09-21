# Five-diagonal support requires nearby kings

Policy commit: `25722e9`.

A five-diagonal is unsupported whenever the kings are more than two king steps apart after White moves. The gate applies both to ordinary support and declared exceptions. It does not change the three- or seven-diagonal support definitions. The now-incompatible Kd4/Bc6/Nd5 versus Ka5 declaration and its note were removed. The guide states the new requirement explicitly.

In the supplied Kd8/Ba4/Nd3 versus Ka5 position, Be8 is unsupported and Bb3 is selected. Regression tests cover all D4 symmetries, the two/three-step boundary after a king move, the supplied position, and support declarations. Older distant-king expectations were updated; positive fixtures for other support mechanisms were kept with nearby kings where possible. All 174 bishop-and-knight tests and the build passed.

Four phase/replay tests also passed.

## Exhaustive follow-through audits

Both audits enumerate all legal KBNvK placements, select supported post-White starts of the indicated size, and follow every tied best application-policy path through smaller or unsupported diagonals to mate, capture, stalemate or cycles. Black return history is retained. Clock/repetition claims are excluded. This is not historical reachability or proof against arbitrary legal Black defense. Reference-policy, symmetry, enumeration and graph checks passed in both runs; both loops gates fail.

### Seven-stage regression

| Measure | Before | After |
|---|---:|---:|
| Supported seven starts | 134,144 | 134,144 |
| Seven boards directly on discovered cycles | 0 | 56 |
| Starts that can reach a cycle | 130,560 | 130,536 |
| Starts that can reach mate | 864 | 864 |
| Starts that can reach capture/stalemate | 2,784 | 2,808 |
| Downstream cyclic components | 4 | 11 |

Tightening five support changes later choices and introduces mixed five/seven cycles. The seven-stage population is unchanged, so this is a real policy regression in directly cyclic seven placements, not a population-count artifact. Eventual loop reachability drops by 24 but failure reachability increases by 24. Downstream cyclic boards comprise 120 five-diagonal and 56 seven-diagonal placements. The stricter user-requested support rule is retained; the staged task is not complete.

### Complete five-stage population

Of 7,808 supported five-diagonal starts, 104 (1.33%) lie directly on a discovered cycle, 6,528 can reach a cycle, 712 can reach mate, and 576 can reach capture/stalemate. There are eight cyclic components; their boards comprise 104 five-diagonal and 24 unsupported placements. This census is broader than the five-diagonal positions reachable from seven starts, so their cycle counts are not interchangeable. Outcomes can overlap.

## Minimal loops reachable from seven starts

All witnesses below replay against production best moves for three repetitions, with light bishops nearer a8 than h1. The first mixed five/seven loop is loaded in the sidebar with Redo available.

1. [Kc8, Bb3, Nd3 — Black Kb6](http://localhost:5173/mate/bishop-knight#fen=2K5/8/1k6/8/8/1B1N4/8/8_w_-_-_0_1&moves=Ba4,Ka5,Bb3,Kb6&cursor=0) — Ba4 Ka5 Bb3 Kb6
2. [Kd8, Bb3, Nd3 — Black Kb6](http://localhost:5173/mate/bishop-knight#fen=3K4/8/1k6/8/8/1B1N4/8/8_w_-_-_0_1&moves=Ba4,Ka5,Bb3,Kb6&cursor=0) — Ba4 Ka5 Bb3 Kb6
3. [Ke7, Bc4, Nd3 — Black Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k1K3/8/8/2B5/3N4/8/8_w_-_-_0_1&moves=Bb5,Kb6,Bc4,Kc7&cursor=0) — Bb5 Kb6 Bc4 Kc7
4. [Kd7, Bb3, Nd3 — Black Kb6](http://localhost:5173/mate/bishop-knight#fen=8/3K4/1k6/8/8/1B1N4/8/8_w_-_-_0_1&moves=Ba4,Ka5,Bb3,Kb6&cursor=0) — Ba4 Ka5 Bb3 Kb6
5. [Ke6, Bc4, Nd3 — Black Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/4K3/8/2B5/3N4/8/8_w_-_-_0_1&moves=Bb5,Kb6,Bc4,Kc7&cursor=0) — Bb5 Kb6 Bc4 Kc7
6. [Kd6, Bb3, Nd3 — Black Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1k1K4/8/8/1B1N4/8/8_w_-_-_0_1&moves=Ba4,Ka5,Bb3,Kb6&cursor=0) — Ba4 Ka5 Bb3 Kb6
7. [Kd5, Bb3, Nd3 — Black Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/3K4/8/1B1N4/8/8_w_-_-_0_1&moves=Ba4,Ka5,Bb3,Kb6&cursor=0) — Ba4 Ka5 Bb3 Kb6
8. [Kc5, Bc6, Nb4 — Black Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/2B5/2K5/1N6/8/8/8_w_-_-_0_1&moves=Kd6,Ka7,Kc5,Kb8&cursor=0) — Kd6 Ka7 Kc5 Kb8
9. [Kb6, Ba4, Nd5 — Black Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/1K6/3N4/B7/8/8/8_w_-_-_0_1&moves=Bc6,Kc8,Ba4,Kd8&cursor=0) — Bc6 Kc8 Ba4 Kd8
10. [Kc5, Bc6, Nd5 — Black Ka6](http://localhost:5173/mate/bishop-knight#fen=8/8/k1B5/2KN4/8/8/8/8_w_-_-_0_1&moves=Be8,Kb7,Bc6%2B,Ka6&cursor=0) — Be8 Kb7 Bc6+ Ka6
11. [Kc5, Be8, Nd5 — Black Ka6](http://localhost:5173/mate/bishop-knight#fen=4B3/8/k7/2KN4/8/8/8/8_w_-_-_0_1&moves=Bc6,Ka5,Be8,Ka6&cursor=0) — Bc6 Ka5 Be8 Ka6

## Minimal loops from the complete five-stage audit

1. [Kb6, Bc6, Nd5 — Black Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/1KB5/3N4/8/8/8/8_w_-_-_0_1&moves=Ba4,Kd8,Bc6,Kc8&cursor=0) — Ba4 Kd8 Bc6 Kc8
2. [Kd8, Bd7, Nd3 — Black Kb7](http://localhost:5173/mate/bishop-knight#fen=3K4/1k1B4/8/8/8/3N4/8/8_w_-_-_0_1&moves=Be8,Kb6,Bd7,Kb7&cursor=0) — Be8 Kb6 Bd7 Kb7
3. [Kd4, Ba4, Nb6 — Black Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/1N6/8/B2K4/8/8/8_w_-_-_0_1&moves=Kc5,Kd8,Kd4,Kc7&cursor=0) — Kc5 Kd8 Kd4 Kc7
4. [Kd4, Bb5, Nb6 — Black Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/1N6/1B6/3K4/8/8/8_w_-_-_0_1&moves=Kc5,Kd8,Kd4,Kc7&cursor=0) — Kc5 Kd8 Kd4 Kc7
5. [Kd5, Bc6, Nb6 — Black Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/1NB5/3K4/8/8/8/8_w_-_-_0_1&moves=Kc5,Kd8,Kd5,Kc7&cursor=0) — Kc5 Kd8 Kd5 Kc7
6. [Kd6, Bc6, Nb4 — Black Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/2BK4/8/1N6/8/8/8_w_-_-_0_1&moves=Kc5,Kb8,Kd6,Ka7&cursor=0) — Kc5 Kb8 Kd6 Ka7
7. [Kc5, Bc6, Nd5 — Black Ka6](http://localhost:5173/mate/bishop-knight#fen=8/8/k1B5/2KN4/8/8/8/8_w_-_-_0_1&moves=Be8,Kb7,Bc6%2B,Ka6&cursor=0) — Be8 Kb7 Bc6+ Ka6
8. [Kc5, Be8, Nd5 — Black Ka6](http://localhost:5173/mate/bishop-knight#fen=4B3/8/k7/2KN4/8/8/8/8_w_-_-_0_1&moves=Bc6,Ka5,Be8,Ka6&cursor=0) — Bc6 Ka5 Be8 Ka6
