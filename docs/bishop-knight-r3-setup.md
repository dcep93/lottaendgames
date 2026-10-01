# R3: fastest forced central setup

R3 targets White king, bishop and knight on **d4/e4/d5/e5**, with both king and knight on the opposite color from the bishop. It minimizes White moves to that formation under the most delaying legal Black replies. Existing r1 and r2 positions take priority, so a route can enter either stage before completing the formation.

The rule order remains **mate → pieces safe → no stalemate → r1 → r2 → r3 → r4 and later setup rules**. Neither r1 nor r2's move table changed. Checkmate keeps its own higher-priority attribution. R1 still has exactly 99 reachable source edges and no outside r1 labels.

## Exhaustive result

Every legal KBN-v-K placement was checked with both turns, both bishop colors and all board orientations. Counts use White moves, starting with a fresh halfmove clock. Every legal Black reply is included, as are all selected White ties.

| Measure | Result |
|---|---:|
| Legal board-and-turn starts | 24,536,088 |
| Winning starts | 22,010,352 |
| Drawn starts | 2,525,736 |
| Winning starts without forced mate | 0 |
| Winning starts needing more than 50 moves | 0 |
| Mean worst-case mate length | 37.32 |
| Median | 38 |
| 90th percentile | 40 |
| 95th percentile | 41 |
| 99th percentile | 42 |
| Maximum | **44** |

The previous policy's maximum was 72, median 46 and mean 46.45. The setup-only minimax maximum is **12 White moves**. This is an exact fastest path to the central formation, not a claim of globally shortest mate: r1 and r2 remain fixed, and setup-distance ties use a deterministic move.

| Worst-case White moves to mate | Winning starts | Share |
|---|---:|---:|
| Already mate | 464 | 0.002% |
| 1–10 | 41,472 | 0.188% |
| 11–20 | 154,012 | 0.700% |
| 21–30 | 500,056 | 2.272% |
| 31–35 | 2,980,092 | 13.540% |
| 36–40 | 16,941,096 | 76.969% |
| 41–44 | 1,393,160 | 6.330% |

The bound applies from a fresh clock. Importing an already nearly exhausted fifty-move clock does not grant another fifty moves.

## Longest replay

[44-move worst-case line](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/8/3k4/K2B3N_w_-_-_0_1&moves=Bb3,Kc3,Ka2,Kd2,Ka3,Kc1,Kb4,Kd2,Bc4,Ke3,Kc3,Ke4,Nf2%2B,Ke3,Nd3,Ke4,Ba2,Kf3,Bd5%2B,Ke3,Ne5,Kf4,Kd4,Kf5,Nc6,Kf4,Be4,Kg3,Ne5,Kh4,Bf5,Kg5,Ke4,Kf6,Ng6,Kg7,Ke5,Kf7,Be4,Kg7,Ke6,Kg8,Kf6,Kh7,Ba8,Kg8,Bd5%2B,Kh7,Bf7,Kh6,Bg8,Kh5,Ne5,Kh4,Kf5,Kg3,Ng4,Kg2,Bc4,Kf3,Bd3,Kg3,Be4,Kh4,Kf4,Kh3,Bd5,Kh4,Bf7,Kh3,Ne3,Kh2,Kf3,Kh1,Bc4,Kh2,Ng2,Kh1,Kg3,Kg1,Be2,Kh1,Nf4,Kg1,Nh3%2B,Kh1,Bf3%23&cursor=0).

It starts with White Ka1, Bd1, Nh1 and Black Kd2. The phases are 12 r3 moves, 12 r2 moves, 19 r1 moves, then the higher-priority mating move.

## Storage and verification

The browser loads a content-hashed **5 MiB binary** once on entering the KBN trainer (approximately 1 MB with gzip). A checksum is verified before a session mounts; loading failures show a Retry button. Other trainers do not fetch it. The lookup canonicalizes eight D4 transforms and reads one 16-bit entry; it performs no graph search.

Ten canonical White-king slots × 64³ remaining placements gives 2,621,440 entries. Each entry has four distance bits and twelve move bits. Distance zero marks a target; 0xffff means absent. There are 1,352,867 canonical move entries and 41 canonical targets (328 physical targets). The 40 winning White positions outside the setup attractor have an immediate mate, handled by the higher-priority mate rule.

The offline solver checks the min/max distance equations over every legal state. Export additionally checks every encoded move in all physical orientations against every Black reply. The composed-policy audit memoizes distances per placement and turn, certifies the fixed r1/r2 graph using the app, and computes the full mate distribution natively. Independent chess.js/app checks cover sampled starts and complete longest replays; the cached Syzygy census supplies a position-by-position win/draw cross-check when available.

Reproduce from the repository root:

```sh
app/node_modules/.bin/tsx scripts/bishop-knight-audit/build-setup.mts --check
app/node_modules/.bin/tsx scripts/bishop-knight-audit/audit-setup.mts
```

Stage-distance caches are fingerprinted against policy sources. Generation is offline and its native rank arrays stay in `.audit/`; only the packed table and small metadata ship. Generic audit workers explicitly install the checked-in table, so they do not audit the pre-loading fallback. The all-start audit reports how many cached tablebase classes were compared; without that cache it still checks the native move/rank equations and full counts.

[Machine-readable audit](audits/2026-09-30-all-start-r3.json) includes histograms, source fingerprints, stage verification and complete witnesses.

Validation also passed the app production build and 14 focused setup/loading/stage tests. The broader audit-script TypeScript project still reports its pre-existing Square typing errors in `verify-piece-preservation.mts` and `chess.js` resolution errors in `worker.mts`; these do not prevent the checked audit commands from running.
