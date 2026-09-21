# Stable three-diagonal knight targets: supported continuation audit

Implementation commit: `4c67952`. The audit bundled the same policy before that commit was created; its manifest records the previous HEAD. Snapshot fingerprint: `f5069c7958a8fe0061683f7c2a132caacb1a19d9ec3daa8945dd7133bcf1af23`.

For the a6–c8 diagonal, Kd7 now keeps the b5/c6 targets used with Kc7; reflected Kb5 keeps c6/d7. This makes the loaded h1-corner example retain e2/f3 after Kg4. Existing exact-placement target overrides remain. No new move preference was introduced.

After 1. Kg3 Kh1, Kg4 scores two knight moves from support; Nc3 and Nd2 score one. The existing rules select 2. Nc3.

Exhaustive census of 13,660,584 post-White placements; every supported start is followed through supported and unsupported positions until mate, capture, stalemate, or a cycle. All tied best moves and Black return history are included.

| Metric | Before | After |
|---|---:|---:|
| Supported starts | 199,412 | 199,412 |
| Directly cyclic supported positions | 608 | 368 |
| Supported starts that can reach a cycle | 187,388 | 184,892 |
| Can reach mate | 3,496 | 5,936 |
| Can reach capture or stalemate | 8,648 | 8,648 |
| Cyclic components | 43 | 28 |

Directly cyclic supported positions: **368/199,412 (0.1845%)**. Reachable outcome counts can overlap. A component can contain multiple cycles; the links below give one verified representative each.

This does not rerun the full unsupported-only audit. It does not establish mate against arbitrary legal Black defense, and excludes clock/repetition claims.

## Piece-position motifs

| Motif | Supported positions directly on cycles |
|---|---:|
| 7-diagonal; bishop interior; bishop king-protected; knight king-protected | 72 |
| 7-diagonal; bishop interior; bishop king-protected; knight not king-protected | 72 |
| 3-diagonal; bishop interior; bishop king-protected; knight king-protected | 40 |
| 5-diagonal; bishop interior; bishop king-protected; knight king-protected | 32 |
| 5-diagonal; bishop edge; bishop not king-protected; knight not king-protected | 32 |
| 5-diagonal; bishop interior; bishop king-protected; knight not king-protected | 24 |
| 3-diagonal; bishop edge; bishop not king-protected; knight not king-protected | 24 |
| 7-diagonal; bishop edge; bishop not king-protected; knight king-protected | 16 |
| 3-diagonal; bishop edge; bishop king-protected; knight not king-protected | 16 |
| 3-diagonal; bishop edge; bishop king-protected; knight king-protected | 8 |
| 7-diagonal; bishop edge; bishop not king-protected; knight not king-protected | 8 |
| 5-diagonal; bishop edge; bishop king-protected; knight not king-protected | 8 |
| 3-diagonal; bishop interior; bishop king-protected; knight not king-protected | 8 |
| 5-diagonal; bishop interior; bishop not king-protected; knight king-protected | 8 |

## Verification

159 bishop-and-knight tests and the production build passed. The regression checks both king squares, five knight placements, and move ranking in all eight orientations. Audit production/reference, symmetry, enumeration, and independent SCC checks passed. Replay links were checked against production moves for three repetitions.

## Remaining representative loops

Light-square bishops are oriented nearer h1 than a8. Links start at cursor zero for Redo.

1. [Bh5 Kf2 Bd1 Ke1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N4K/8/8/3Bk3_w_-_-_0_1&moves=Bh5,Kf2,Bd1,Ke1&cursor=0)
2. [Ke2 Kh2 Kf3 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/5K2/8/4NBk1_w_-_-_0_1&moves=Ke2,Kh2,Kf3,Kg1&cursor=0)
3. [Bf1 Kh1 Bh3 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/6K1/7B/4N2k/8_w_-_-_0_1&moves=Bf1,Kh1,Bh3,Kh2&cursor=0)
4. [Bh3 Kh1 Bf1 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/6K1/8/4N2k/5B2_w_-_-_0_1&moves=Bh3,Kh1,Bf1,Kh2&cursor=0)
5. [Ng4+ Kg1 Ne3 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/4NK2/6Bk/8_w_-_-_0_1&moves=Ng4%2B,Kg1,Ne3,Kh2&cursor=0)
6. [Ng3 Kg1 Ne4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/4N3/5K2/6Bk/8_w_-_-_0_1&moves=Ng3,Kg1,Ne4,Kh2&cursor=0)
7. [Ne3 Kg1 Nd5 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3N4/8/5K2/6Bk/8_w_-_-_0_1&moves=Ne3,Kg1,Nd5,Kh2&cursor=0)
8. [Ba2 Ka3 Bb1 Ka4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/k1K5/3N4/8/1B6_w_-_-_0_1&moves=Ba2,Ka3,Bb1,Ka4&cursor=0)
9. [Kf4 Kh3 Ke3 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/4N3/4KB2/7k/8_w_-_-_0_1&moves=Kf4,Kh3,Ke3,Kh2&cursor=0)
10. [Ke3 Kf1 Kf4 Ke1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/4NK2/5B2/8/4k3_w_-_-_0_1&moves=Ke3,Kf1,Kf4,Ke1&cursor=0)
11. [Ke3 Ke1 Kd4 Kf1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3KN3/5B2/8/5k2_w_-_-_0_1&moves=Ke3,Ke1,Kd4,Kf1&cursor=0)
12. [Bb1 Kf3 Be4+ Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKBk2/8/8/8_w_-_-_0_1&moves=Bb1,Kf3,Be4%2B,Kf4&cursor=0)
13. [Be4 Kf4 Bb1 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NK4/6k1/8/1B6_w_-_-_0_1&moves=Be4,Kf4,Bb1,Kg3&cursor=0)
14. [Bh5 Kf2 Bf3 Ke1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N1K3/5B2/8/4k3_w_-_-_0_1&moves=Bh5,Kf2,Bf3,Ke1&cursor=0)
15. [Bd1 Kg1 Bf3 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N1K3/5B2/7k/8_w_-_-_0_1&moves=Bd1,Kg1,Bf3,Kh2&cursor=0)
16. [Bh5 Kh2 Bf3 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N1K3/5B2/8/6k1_w_-_-_0_1&moves=Bh5,Kh2,Bf3,Kg1&cursor=0)
17. [Ke5 Kc1 Kd4 Kd1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/8/8/3k4_w_-_-_0_1&moves=Ke5,Kc1,Kd4,Kd1&cursor=0)
18. [Ke5 Kd1 Kd4 Ke2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/8/4k3/8_w_-_-_0_1&moves=Ke5,Kd1,Kd4,Ke2&cursor=0)
19. [Ke5 Ke2 Kd4 Kf2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/8/5k2/8_w_-_-_0_1&moves=Ke5,Ke2,Kd4,Kf2&cursor=0)
20. [Ke5 Kg3 Kd4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/8/7k/8_w_-_-_0_1&moves=Ke5,Kg3,Kd4,Kh2&cursor=0)
21. [Ke5 Kf2 Kd4 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/8/8/6k1_w_-_-_0_1&moves=Ke5,Kf2,Kd4,Kg1&cursor=0)
22. [Kd4 Ke1 Ke5 Ke2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K3/2N1B3/8/4k3/8_w_-_-_0_1&moves=Kd4,Ke1,Ke5,Ke2&cursor=0)
23. [Ke5 Kg4 Kd4 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/6k1/8/8_w_-_-_0_1&moves=Ke5,Kg4,Kd4,Kg3&cursor=0)
24. [Ke5 Kg4 Kd4 Kg5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/6k1/2NKB3/8/8/8_w_-_-_0_1&moves=Ke5,Kg4,Kd4,Kg5&cursor=0)
25. [Kd4 Kf2 Ke5 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K3/2N1B3/8/8/6k1_w_-_-_0_1&moves=Kd4,Kf2,Ke5,Kg1&cursor=0)
26. [Kd4 Kg3 Ke5 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K3/2N1B3/8/7k/8_w_-_-_0_1&moves=Kd4,Kg3,Ke5,Kh2&cursor=0)
27. [Be4 Kg5 Bb1 Kg4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K3/2N3k1/8/8/1B6_w_-_-_0_1&moves=Be4,Kg5,Bb1,Kg4&cursor=0)
28. [Kd4 Ke2 Ke5 Kf2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K3/2N1B3/8/5k2/8_w_-_-_0_1&moves=Kd4,Ke2,Ke5,Kf2&cursor=0)
