# Supported-position continuation audit

Policy commit: `11f23b857a918e874b42b65763de5c47548934ac`. Fingerprint: `66b47b5720fbcb30a3c3aeab40a2c7d43dc33643afb50416cc986fbdae2c69e2`.

The full placement census classified 13,660,584 positions and selected **199,412 supported post-White placements** as starts. Continue through supported and unsupported positions; stop only at mate, capture, or stalemate. All tied best moves and Black return history are included.

| Supported starts | Positions | Percentage |
|---|---:|---:|
| Directly on a loop | 608 | 0.3049% |
| Not directly on a loop | 198,804 | 99.6951% |
| Can reach a loop | 187,388 | 93.9703% |
| Cannot reach a loop | 12,024 | 6.0297% |
| Can reach mate | 3,496 | 1.7532% |
| Can reach capture or stalemate | 8,648 | 4.3368% |

43 cyclic components; 32,254 history states and 33,015 transitions. Terminal outcomes can overlap across tied branches. Direct membership counts supported post-White boards on cycles; a cycle may also contain unsupported boards. Zero loops does not imply forced mate. This is a placement census, not retrograde reachability proof. Black follows the app's policy, not arbitrary legal defense. Clocks and repetition claims are excluded.

## Piece-position distribution

| Supported diagonal | Directly cyclic physical positions | Share of directly cyclic supported positions |
|---|---:|---:|
| 3 | 336 | 55.26% |
| 5 | 104 | 17.11% |
| 7 | 168 | 27.63% |

There are 76 symmetry-distinct supported boards (608 physical boards). The 43 components each have a minimal four-ply representative. All 43 examples replay for three repetitions under the current production policy. Eight additional unsupported physical boards occur in mixed-support cycles; this does not contradict the previous audit, which stopped at support.

| Piece-position motif | Supported positions directly on cycles |
|---|---:|
| 3-diagonal; bishop edge; bishop king-protected; knight not king-protected | 272 |
| 7-diagonal; bishop interior; bishop king-protected; knight king-protected | 72 |
| 7-diagonal; bishop interior; bishop king-protected; knight not king-protected | 72 |
| 3-diagonal; bishop interior; bishop king-protected; knight king-protected | 40 |
| 5-diagonal; bishop interior; bishop king-protected; knight king-protected | 32 |
| 5-diagonal; bishop edge; bishop not king-protected; knight not king-protected | 32 |
| 5-diagonal; bishop interior; bishop king-protected; knight not king-protected | 24 |
| 7-diagonal; bishop edge; bishop not king-protected; knight king-protected | 16 |
| 7-diagonal; bishop edge; bishop not king-protected; knight not king-protected | 8 |
| 3-diagonal; bishop edge; bishop not king-protected; knight not king-protected | 8 |
| 5-diagonal; bishop interior; bishop not king-protected; knight king-protected | 8 |
| 5-diagonal; bishop edge; bishop king-protected; knight not king-protected | 8 |
| 3-diagonal; bishop interior; bishop king-protected; knight not king-protected | 8 |
| 3-diagonal; bishop edge; bishop king-protected; knight king-protected | 8 |

## First candidate, not implemented

With a supported 3-diagonal and an edge bishop protected by White's king, prefer a knight move among moves tied by r1.5. This comes after r1.5, preserving its supported-diagonal and knight-proximity priorities.

A sandboxed selection experiment rejects the old witness in components 2–17: 16 of 43 examples, covering 256 directly cyclic supported placements (42.1%). This is witness coverage, not an exhaustive post-change improvement claim. It can create new loops and would require another audit after approval. No application chess rules were changed in this baseline task.

This targets the lowest diagonal first, per the user's preference. The largest exposure component instead uses a supported 7-diagonal and a central king shuffle; it is reachable from 54,344 supported starts. Direct-position count and reachable-start count rank priorities differently.

## Validation

Production/reference adapter and direct move-history checks passed; symmetry checks covered 1,000 random placements in all eight orientations; full enumeration totals were asserted; SCC reachability matched independent sink removal. Eleven scaffold tests passed. The default unsupported mode remains support-terminal. Scope participates in the checkpoint fingerprint and cross-scope root reuse is rejected.

## All minimal representative loops

Each link starts at cursor zero for Redo. Bishops are light-squared and closer to h1 than a8. Component IDs remain stable within this audit only.

1. [Bh5 Kf2 Bd1 Ke1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N4K/8/8/3Bk3_w_-_-_0_1&moves=Bh5,Kf2,Bd1,Ke1&cursor=0)
2. [Kf2 Kh1 Ke2 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/1N6/8/4K2k/5B2_w_-_-_0_1&moves=Kf2,Kh1,Ke2,Kh2&cursor=0)
3. [Kg3 Kh1 Kg4 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/4N1K1/7B/8/6k1_w_-_-_0_1&moves=Kg3,Kh1,Kg4,Kg1&cursor=0)
4. [Kg3 Kh1 Kg4 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/6K1/7B/8/3N2k1_w_-_-_0_1&moves=Kg3,Kh1,Kg4,Kg1&cursor=0)
5. [Kg3 Kh1 Kg4 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3N4/6K1/7B/8/6k1_w_-_-_0_1&moves=Kg3,Kh1,Kg4,Kg1&cursor=0)
6. [Kf2 Kh1 Ke2 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/1N6/8/8/8/4K2k/5B2_w_-_-_0_1&moves=Kf2,Kh1,Ke2,Kh2&cursor=0)
7. [Kf2 Kh1 Ke2 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/N7/8/8/8/4K2k/5B2_w_-_-_0_1&moves=Kf2,Kh1,Ke2,Kh2&cursor=0)
8. [Kg3 Kh1 Kg4 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/6K1/7B/8/1N4k1_w_-_-_0_1&moves=Kg3,Kh1,Kg4,Kg1&cursor=0)
9. [Kg3 Kh1 Kg4 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1N6/6K1/7B/8/6k1_w_-_-_0_1&moves=Kg3,Kh1,Kg4,Kg1&cursor=0)
10. [Kg3 Kh1 Kg4 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/1N6/8/6K1/7B/8/6k1_w_-_-_0_1&moves=Kg3,Kh1,Kg4,Kg1&cursor=0)
11. [Kg3 Kh1 Kg4 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/1N6/8/8/6K1/7B/8/6k1_w_-_-_0_1&moves=Kg3,Kh1,Kg4,Kg1&cursor=0)
12. [Kg3 Kh1 Kg4 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/6K1/7B/N7/6k1_w_-_-_0_1&moves=Kg3,Kh1,Kg4,Kg1&cursor=0)
13. [Kg3 Kh1 Kg4 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/N7/8/6K1/7B/8/6k1_w_-_-_0_1&moves=Kg3,Kh1,Kg4,Kg1&cursor=0)
14. [Kg3 Kh1 Kg4 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/N7/8/8/6K1/7B/8/6k1_w_-_-_0_1&moves=Kg3,Kh1,Kg4,Kg1&cursor=0)
15. [Kg3 Kh1 Kg4 Kg1](http://localhost:5173/mate/bishop-knight#fen=N7/8/8/8/6K1/7B/8/6k1_w_-_-_0_1&moves=Kg3,Kh1,Kg4,Kg1&cursor=0)
16. [Kg3 Kh1 Kg4 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/6K1/N6B/8/6k1_w_-_-_0_1&moves=Kg3,Kh1,Kg4,Kg1&cursor=0)
17. [Kg3 Kh1 Kg4 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/N5K1/7B/8/6k1_w_-_-_0_1&moves=Kg3,Kh1,Kg4,Kg1&cursor=0)
18. [Ne4 Kh2 Nc3 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/6K1/2N4B/8/6k1_w_-_-_0_1&moves=Ne4,Kh2,Nc3,Kg1&cursor=0)
19. [Ke2 Kh2 Kf3 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/5K2/8/4NBk1_w_-_-_0_1&moves=Ke2,Kh2,Kf3,Kg1&cursor=0)
20. [Ng4+ Kg1 Ne3 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/4NK2/6Bk/8_w_-_-_0_1&moves=Ng4%2B,Kg1,Ne3,Kh2&cursor=0)
21. [Ng3 Kg1 Ne4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/4N3/5K2/6Bk/8_w_-_-_0_1&moves=Ng3,Kg1,Ne4,Kh2&cursor=0)
22. [Ne3 Kg1 Nd5 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3N4/8/5K2/6Bk/8_w_-_-_0_1&moves=Ne3,Kg1,Nd5,Kh2&cursor=0)
23. [Ba2 Ka3 Bb1 Ka4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/k1K5/3N4/8/1B6_w_-_-_0_1&moves=Ba2,Ka3,Bb1,Ka4&cursor=0)
24. [Kf4 Kh3 Ke3 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/4N3/4KB2/7k/8_w_-_-_0_1&moves=Kf4,Kh3,Ke3,Kh2&cursor=0)
25. [Ke3 Kf1 Kf4 Ke1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/4NK2/5B2/8/4k3_w_-_-_0_1&moves=Ke3,Kf1,Kf4,Ke1&cursor=0)
26. [Ke3 Ke1 Kd4 Kf1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3KN3/5B2/8/5k2_w_-_-_0_1&moves=Ke3,Ke1,Kd4,Kf1&cursor=0)
27. [Bb1 Kf3 Be4+ Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKBk2/8/8/8_w_-_-_0_1&moves=Bb1,Kf3,Be4%2B,Kf4&cursor=0)
28. [Be4 Kf4 Bb1 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NK4/6k1/8/1B6_w_-_-_0_1&moves=Be4,Kf4,Bb1,Kg3&cursor=0)
29. [Bh5 Kf2 Bf3 Ke1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N1K3/5B2/8/4k3_w_-_-_0_1&moves=Bh5,Kf2,Bf3,Ke1&cursor=0)
30. [Bd1 Kg1 Bf3 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N1K3/5B2/7k/8_w_-_-_0_1&moves=Bd1,Kg1,Bf3,Kh2&cursor=0)
31. [Bh5 Kh2 Bf3 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N1K3/5B2/8/6k1_w_-_-_0_1&moves=Bh5,Kh2,Bf3,Kg1&cursor=0)
32. [Ke5 Kc1 Kd4 Kd1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/8/8/3k4_w_-_-_0_1&moves=Ke5,Kc1,Kd4,Kd1&cursor=0)
33. [Ke5 Kd1 Kd4 Ke2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/8/4k3/8_w_-_-_0_1&moves=Ke5,Kd1,Kd4,Ke2&cursor=0)
34. [Ke5 Ke2 Kd4 Kf2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/8/5k2/8_w_-_-_0_1&moves=Ke5,Ke2,Kd4,Kf2&cursor=0)
35. [Ke5 Kg3 Kd4 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/8/7k/8_w_-_-_0_1&moves=Ke5,Kg3,Kd4,Kh2&cursor=0)
36. [Ke5 Kf2 Kd4 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/8/8/6k1_w_-_-_0_1&moves=Ke5,Kf2,Kd4,Kg1&cursor=0)
37. [Kd4 Ke1 Ke5 Ke2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K3/2N1B3/8/4k3/8_w_-_-_0_1&moves=Kd4,Ke1,Ke5,Ke2&cursor=0)
38. [Ke5 Kg4 Kd4 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2NKB3/6k1/8/8_w_-_-_0_1&moves=Ke5,Kg4,Kd4,Kg3&cursor=0)
39. [Ke5 Kg4 Kd4 Kg5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/6k1/2NKB3/8/8/8_w_-_-_0_1&moves=Ke5,Kg4,Kd4,Kg5&cursor=0)
40. [Kd4 Kf2 Ke5 Kg1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K3/2N1B3/8/8/6k1_w_-_-_0_1&moves=Kd4,Kf2,Ke5,Kg1&cursor=0)
41. [Kd4 Kg3 Ke5 Kh2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K3/2N1B3/8/7k/8_w_-_-_0_1&moves=Kd4,Kg3,Ke5,Kh2&cursor=0)
42. [Be4 Kg5 Bb1 Kg4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K3/2N3k1/8/8/1B6_w_-_-_0_1&moves=Be4,Kg5,Bb1,Kg4&cursor=0)
43. [Kd4 Ke2 Ke5 Kf2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K3/2N1B3/8/5k2/8_w_-_-_0_1&moves=Kd4,Ke2,Ke5,Kf2&cursor=0)

Full immutable audit bundle: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20-supported-baseline`.

```sh
cd app
npm run audit:unsupported -- --scope supported --out /absolute/new/supported-audit --workers 8
```
