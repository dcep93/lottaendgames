# Seven-diagonal harness: exhaustive baseline

The stage selects supported seven-diagonal post-White starts and follows **every tied best continuation through five-, three-, and unsupported positions**. Reaching another supported diagonal is not a terminal success. Mate, capture, stalemate, and cycles remain separate outcomes. No chess preferences were changed for this baseline; r1.5 remains intact.

Policy commit: `3917e00`. Harness commit: `a20a411`.
Snapshot fingerprint: `a45b39ebd7770a432db4b7a0eab3abe0c5b2c442aa8de0502169b9cfc3ec7111`.

The exhaustive placement census contains 13,660,584 KBNvK boards and selects 176,200 supported seven-diagonal starts. This is an enumeration of placements, not a proof of historical reachability. The continuation graph follows the application's Black policy, including its return-history state, rather than every legal Black move. Draw clocks and repetition claims are excluded.

| Measure | Count |
|---|---:|
| Seven-diagonal starting positions | 176,200 |
| Can reach a cycle | 168,552 (95.6595%) |
| Cannot reach a cycle | 7,648 |
| Seven-diagonal boards directly on a discovered cycle | 168 (0.0953%) |
| Can reach mate | 856 |
| Can reach capture or stalemate | 6,848 |
| Downstream cyclic components | 19 |

Reachable outcomes can overlap. The loop gate fails; the mate gate also fails. Each component may contain multiple cycles; one minimal four-ply representative is linked below. Direct membership deduplicates physical boards across components and histories.

## Actual downstream cyclic placements

| Current support | Distinct boards |
|---|---:|
| Seven diagonal | 168 |
| Five diagonal | 64 |
| Three diagonal | 0 |
| Unsupported | 8 |
| Total | 240 |

Of the 168 seven-diagonal boards, 144 have a central king protecting a central bishop. Half of those also have a king-protected knight. The other 24 have an edge bishop. The highest-reach component is #5, reachable from 54,104 selected starts. Reachability counts across components overlap.

## Verification and next stage

Production/reference policy, D4 symmetry, complete enumeration, and independent graph checks passed. All listed witnesses replay against the current production best moves, including Black return history, for three repetitions. Four plies are the shortest possible nontrivial placement loop. The staged harness has separate `loops` and `mate` gates; neither treats a smaller supported diagonal as success.

Seven remains the active stage. No new move preference has been installed. A scratch king-proximity experiment broke old witnesses but produced a new loop and was not retained. Five and three stages must wait for seven's continuation failures to be resolved.

## Minimal representatives

Bishops are light-squared and oriented nearer h1 than a8; then the knight is oriented toward a1. Cursor zero enables Redo.

1. [Ba2 Ka3 Bb1 Ka4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/k1K5/3N4/8/1B6_w_-_-_0_1&moves=Ba2,Ka3,Bb1,Ka4&cursor=0)
2. [Bb1 Kf3 Be4+ Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKBk2/8/8/8_w_-_-_0_1&moves=Bb1,Kf3,Be4%2B,Kf4&cursor=0)
3. [Be4 Kf4 Bb1 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NK4/6k1/8/1B6_w_-_-_0_1&moves=Be4,Kf4,Bb1,Kg3&cursor=0)
4. [Ke5 Kc1 Kd4 Kd1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/8/8/3k4_w_-_-_0_1&moves=Ke5,Kc1,Kd4,Kd1&cursor=0)
5. [Ke5 Kd1 Kd4 Ke2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/8/4k3/8_w_-_-_0_1&moves=Ke5,Kd1,Kd4,Ke2&cursor=0)
6. [Ke5 Ke2 Kd4 Kf2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/8/5k2/8_w_-_-_0_1&moves=Ke5,Ke2,Kd4,Kf2&cursor=0)
7. [Ke5 Kg3 Kd4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/8/7k/8_w_-_-_0_1&moves=Ke5,Kg3,Kd4,Kh2&cursor=0)
8. [Ke5 Kf2 Kd4 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/8/8/6k1_w_-_-_0_1&moves=Ke5,Kf2,Kd4,Kg1&cursor=0)
9. [Kd4 Ke1 Ke5 Ke2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K3/2N1B3/8/4k3/8_w_-_-_0_1&moves=Kd4,Ke1,Ke5,Ke2&cursor=0)
10. [Ke5 Kg4 Kd4 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/6k1/8/8_w_-_-_0_1&moves=Ke5,Kg4,Kd4,Kg3&cursor=0)
11. [Ke5 Kg4 Kd4 Kg5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/6k1/2NKB3/8/8/8_w_-_-_0_1&moves=Ke5,Kg4,Kd4,Kg5&cursor=0)
12. [Kd4 Kf2 Ke5 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K3/2N1B3/8/8/6k1_w_-_-_0_1&moves=Kd4,Kf2,Ke5,Kg1&cursor=0)
13. [Kd4 Kg3 Ke5 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K3/2N1B3/8/7k/8_w_-_-_0_1&moves=Kd4,Kg3,Ke5,Kh2&cursor=0)
14. [Be4 Kg5 Bb1 Kg4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K3/2N3k1/8/8/1B6_w_-_-_0_1&moves=Be4,Kg5,Bb1,Kg4&cursor=0)
15. [Kd4 Ke2 Ke5 Kf2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K3/2N1B3/8/5k2/8_w_-_-_0_1&moves=Kd4,Ke2,Ke5,Kf2&cursor=0)
16. [Bh5 Kf2 Bd1 Ke1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N4K/8/8/3Bk3_w_-_-_0_1&moves=Bh5,Kf2,Bd1,Ke1&cursor=0)
17. [Bf3 Ke1 Bh5 Kf2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/7B/2N1K3/8/5k2/8_w_-_-_0_1&moves=Bf3,Ke1,Bh5,Kf2&cursor=0)
18. [Ke5 Kh3 Kf4 Kh4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/4NK1k/5B2/8/8_w_-_-_0_1&moves=Ke5,Kh3,Kf4,Kh4&cursor=0)
19. [Ke3 Kh4 Kf4 Kh3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/4NK2/5B1k/8/8_w_-_-_0_1&moves=Ke3,Kh4,Kf4,Kh3&cursor=0)
