# Unsupported-position audit

Policy commit: `1f96a049f2a3f877c5921fe636d541467e7a9051`. Fingerprint: `22067a0d0113f1fa702d676146d3675bc7b58804a9aafdf2634bf484e6baee96`.

All **13,660,584** post-White KBNvK placements were enumerated, including both bishop colors and all rotations/reflections. **13,461,172** are unsupported; **199,412** are supported. Every tied best move is followed.

| Measure | Placements | % of unsupported | Previous audit |
|---|---:|---:|---:|
| Can reach an unsupported loop | 484,724 | 3.6009% | 10,408 |
| Cannot reach an unsupported loop | 12,976,448 | 96.3991% | 13,450,764 |
| On a loop with reachable history | 7,616 | 0.0566% | 5,600 |
| Fresh starts that can return to a loop containing themselves | 248 | 0.0018% | 704 |
| Only loop outcomes | 24,964 | 0.1855% | 9,296 |
| Both loop and support outcomes | 459,352 | 3.4124% | 1,048 |
| Can reach support | 10,854,160 | 80.6331% | 10,680,340 |
| Can reach mate without first entering support | 1,616 | 0.0120% | 1,224 |
| Can reach capture or stalemate | 2,624,728 | 19.4985% | 2,802,932 |

Outcome categories overlap except can-loop versus cannot-loop. “Can loop” is existential among best-move ties. Direct loop membership counts a board occurring on a history-aware cycle; a fresh load can select a different first Black reply. “Cannot loop” does not imply forced mate: the audit stops at support, mate, capture, or stalemate. Clocks and repetition claims are excluded. Black follows the app policy, not arbitrary legal defense.

## Archetypes

501 cyclic strongly connected components, 1,466,966 history states, 1,480,601 transitions. A component can contain several cycles. Reach counts overlap.

| Archetype | Components | Reachable unsupported starts |
|---|---:|---:|
| King shuffle | 55 | 367,384 |
| Knight shuttle | 422 | 73,020 |
| Bishop shuttle | 23 | 47,064 |
| Mixed-piece cycle | 1 | 56 |

## Highest exposure components

Reach measures exposure, not guaranteed gains from a rule change. Exclusive reach counts starts that cannot reach any other component. Fresh-load links are checked for three repetitions.

| Rank | Archetype | Reach | Exclusive | Loop |
|---|---|---:|---:|---|
| 1 | King shuffle | 288,808 | 279,964 | [Ke5 Kc8 Kd4 Kd7](http://localhost:5173/mate/bishop-knight#fen=B7/3k4/8/3N4/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kc8,Kd4,Kd7&cursor=0) |
| 2 | Knight shuttle | 31,400 | 31,192 | [Nc3+ Kd6 Nd5 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/8/2k5/3N4/3KB3/8/8/8_w_-_-_0_1&moves=Nc3%2B,Kd6,Nd5,Kc6&cursor=0) |
| 3 | King shuffle | 26,104 | 14,000 | [Kd4 Kh4 Ke5 Kh5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4K2k/4N3/8/8/7B_w_-_-_0_1&moves=Kd4,Kh4,Ke5,Kh5&cursor=0) |
| 4 | Bishop shuttle | 20,252 | 17,988 | [Ba8 Ke6 Bd5+ Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/3N4/2KBk3/8/8/8/8_w_-_-_0_1&moves=Ba8,Ke6,Bd5%2B,Ke5&cursor=0) |
| 5 | King shuffle | 18,984 | 9,244 | [Kd4 Kh5 Ke5 Kg6](http://localhost:5173/mate/bishop-knight#fen=8/8/6k1/4K3/4N3/8/8/7B_w_-_-_0_1&moves=Kd4,Kh5,Ke5,Kg6&cursor=0) |
| 6 | Knight shuttle | 11,000 | 10,864 | [Nc5 Ke7 Nd3 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/3KB3/3N4/8/8_w_-_-_0_1&moves=Nc5,Ke7,Nd3,Kf6&cursor=0) |
| 7 | King shuffle | 10,384 | 10,184 | [Kd4 Ke7 Ke5 Kd7](http://localhost:5173/mate/bishop-knight#fen=8/3k3B/8/4K3/4N3/8/8/8_w_-_-_0_1&moves=Kd4,Ke7,Ke5,Kd7&cursor=0) |
| 8 | Bishop shuttle | 10,216 | 10,080 | [Ba2 Ke4 Bd5+ Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/4N3/2KBk3/8/8/8/8_w_-_-_0_1&moves=Ba2,Ke4,Bd5%2B,Ke5&cursor=0) |
| 9 | Knight shuttle | 10,208 | 10,088 | [Nh5+ Kg5 Ng3 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/3KB3/6N1/8/8_w_-_-_0_1&moves=Nh5%2B,Kg5,Ng3,Kf6&cursor=0) |
| 10 | King shuffle | 8,048 | 6,864 | [Ke5 Ke8 Kd4 Kf7](http://localhost:5173/mate/bishop-knight#fen=B7/5k2/8/3N4/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Ke8,Kd4,Kf7&cursor=0) |
| 11 | King shuffle | 6,776 | 6,664 | [Ke5 Kc8 Kd4 Kd8](http://localhost:5173/mate/bishop-knight#fen=B2k4/8/8/3N4/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kc8,Kd4,Kd8&cursor=0) |
| 12 | King shuffle | 5,204 | 4,820 | [Kd4 Kg6 Ke5 Kf7](http://localhost:5173/mate/bishop-knight#fen=8/5k2/8/4K3/4N3/8/8/7B_w_-_-_0_1&moves=Kd4,Kg6,Ke5,Kf7&cursor=0) |
| 13 | Bishop shuttle | 4,784 | 4,696 | [Bh1 Kf4 Be4 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/4k3/3NB3/3K4/8/8_w_-_-_0_1&moves=Bh1,Kf4,Be4,Ke5&cursor=0) |
| 14 | Knight shuttle | 4,048 | 4,048 | [Ne7+ Ke5 Ng6+ Kf5](http://localhost:5173/mate/bishop-knight#fen=B7/5K2/6N1/5k2/8/8/8/8_w_-_-_0_1&moves=Ne7%2B,Ke5,Ng6%2B,Kf5&cursor=0) |
| 15 | Bishop shuttle | 3,240 | 3,232 | [Bg2 Kg3 Bf1 Kg4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3K2k1/7N/8/5B2_w_-_-_0_1&moves=Bg2,Kg3,Bf1,Kg4&cursor=0) |

## Selection mechanisms

Grouped by the last priority eliminating a candidate on witness moves. Descriptive, not a causal proof.

| Mechanism | Components | Reach |
|---|---:|---:|
| King shuffle / king protection of knight + noncentral bishop distance from Black | 4 | 299,760 |
| King shuffle / noncentral bishop distance from Black | 36 | 70,836 |
| Knight shuttle / king protection of knight | 4 | 31,480 |
| Bishop shuttle / bishop on long diagonal + king-protected central bishop | 2 | 20,252 |
| Bishop shuttle / bishop distance from Black + bishop on long diagonal | 9 | 15,920 |
| Knight shuttle / king protection of knight + knight distance to precage | 3 | 11,000 |
| Knight shuttle / knight center distance + knight distance to precage | 1 | 10,208 |
| Knight shuttle / knight center distance | 293 | 9,936 |
| Knight shuttle / noncentral bishop distance from Black | 9 | 7,556 |
| Bishop shuttle / bishop distance from Black + king-protected central bishop | 2 | 4,784 |
| King shuffle / king off bishop color + minors safe | 4 | 3,952 |
| Bishop shuttle / bishop on long diagonal + minors safe | 1 | 3,240 |
| Knight shuttle / knight center distance + noncentral bishop distance from Black | 111 | 2,888 |
| King shuffle / king center distance + r5 | 6 | 2,840 |
| Bishop shuttle / noncentral bishop distance from Black | 4 | 2,624 |
| Bishop shuttle / minors safe + noncentral bishop distance from Black | 5 | 252 |
| King shuffle / king center distance + king defense of knight | 1 | 56 |
| Mixed-piece cycle / king protection of knight | 1 | 56 |
| King shuffle / knight distance to precage | 2 | 48 |
| King shuffle / king center distance + no stalemate | 1 | 24 |
| King shuffle / king off bishop color | 1 | 16 |
| Knight shuttle / minors safe + noncentral bishop distance from Black | 1 | 8 |

## Validation and artifacts

Deterministic samples compare the optimized worker to the unmodified production bundle and direct production calls. One thousand random placements are checked in all eight symmetries. Enumeration totals are asserted. Independent SCC analysis and sink removal must agree on loop reachability. Witnesses replay three times against production rules.

`manifest.json` identifies the exact bundled policy; `progress.json` reports progress; `census.sqlite` contains resumable roots, policies and transitions; `result.json` includes components, frames, selection traces and loop links; `root-family-membership.json` supports overlap analysis.

## Recommended next investigation

Focus first on the largest central-king shuffle: **1. Ke5 Kc8 2. Kd4 Kd7**.
It is reachable from 288,808 unsupported starts (59.6% of loop-reaching starts);
279,964 starts can reach no other current loop component. This component also
has exits to support.

White's king alternates between d4 and e5, protecting Nd5 from both squares.
Ba8 remains noncentral, and Nd5 blocks its route down the long diagonal.
At the first move, Ke5 ties with Ne3 and Nc3. At the second, Kd4 ties with Bc6,
Nf6, and Nf4. Thus this is a permitted best-move loop, not an unavoidable line.
Investigating a preference that distinguishes these king shuffles from minor-piece
progress has much greater measured exposure than the individual knight shuttles.

Across the whole audit, 94.8% of loop-reaching starts also have a best-move path
to support. There are 24,964 starts with only loop outcomes. No playing rules
were changed for this audit.

## Reusable tooling

Run from `app/`:

```sh
npm run audit:unsupported -- --out /new/audit \
  --roots-from /previous/audit --compare /previous/audit/result.json
```

The full census/graph phase took 1,395 seconds on this machine. Bundling,
parallel workers, pure-read memoization, per-position policy reuse, and SQLite
checkpoints are now repository tooling. Root caching can skip the roughly
six-minute enumeration phase when the support/initial-Black evaluator is unchanged.
Every White policy is still recomputed after preferences change.

Eight scaffold tests pass. An integration check compared every cached root record
and every initial child position against this complete census, covering all
13,660,584 placements, with no White-policy reuse. The audit artifacts remain in
`/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-20`.
