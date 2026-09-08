# Two Bishops controlled-screen recheck — 2026-09-08

The new screening criterion requires White to control **every square beyond White's king away from the bishop**. A hidden tail containing an uncontrolled square invalidates that wall. The former blanket exemption based on distance from the edge is removed; an endpoint still has no hidden tail. R10/r12 use this criterion on both diagonals, and r6 uses it for its Black-facing Phase 2 barrier.

The three recently checked loop/test positions now guarantee mate within **41, 41, and 79 plies**, respectively. A follow-up check proves mate within **23 plies** from the first former stalemate start. The loaded target-priority position still permits a non-mating continuation: with its supplied halfmove clock of **42**, the fifty-move draw occurs after **58 additional plies**, one ply before the longest structural mating continuation. These are results for the five checked starts, not a proof about all possible positions.

## Scope and fingerprints

Each of the five roots used a fresh production adapter and an empty proof map. Every tied preferred White move and every legal Black reply was included, without reusing historical census expansions or persisted proofs. The checks completed below their configured 2,500/5,000-position caps, so each structural mating bound covers the complete reachable graph rather than a capped sample. The draw continuation was then found using the supplied starting clock. The follow-up stopped at that playable counterexample; no old census roots or additional positions were searched.

- Engine fingerprint: `12d2647dc3b8407c37ff489627fa99fa5fd922568b6da30e9853a58c388922eb`
- Policy fingerprint: `bd67447b4ae4e23652a7a9c8ce169a7c97bae8c2cc3522824ae559c2915475fc`
- These fingerprints remained unchanged before and after the proof checks and independent replay validation; the final comment correction was already included.

| Starting FEN | Initial preferred move / final deciding rule | Maximum mate plies | Cap | Expanded canonical positions | White choices | Black replies |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `8/7B/6K1/8/8/7k/8/2B5 w - - 0 1` | Kf6 / r10 | 41 | 2,500 | 256 | 256 | 819 |
| `8/8/7B/8/3K4/8/8/1B1k4 w - - 0 1` | Kc3 / r10 | 41 | 2,500 | 176 | 176 | 490 |
| `4B2B/8/5K1k/8/8/8/8/8 w - - 0 1` | Bg7+ / r3 | 79 | 5,000 | 1,286 | 1,290 | 4,897 |
| `4Bk1B/8/5K2/8/8/8/8/8 w - - 0 1` | Ba4 / r30 | 23 | 5,000 | 24 | 24 | 25 |
| `8/8/4K3/8/8/4k3/1B6/1B6 w - - 42 22` | Kd5 / r10 | 59 structurally; draw at 58 further plies | 2,500 | 473 | 475 | 1,666 |

The second former stalemate's universal-mate test has been restored from its previous TODO to a normal passing test, supported by the successful current proof. The preceding 93-ply bound and later cycle counterexample are historical; the current complete bound is 79 plies.

## Where the previous loops break

The [previous four-ply loop](two-bishops-target-priority-recheck-2026-09-08.md) breaks immediately: **Kf6** replaces **Bd2**, decided by r10. With Bh7 and Kg6, the hidden square f5 is controlled by the king, but e4, d3, c2, and b1 are uncontrolled. Bd2 therefore receives no wall count or target (`99`, no target squares). Kf6 restores a valid wall, retaining five diagonals and target f5 one king step away.

The previous 18-ply loop still starts **Kc3**, but breaks at **ply 3**: after **Kc3 Ke1**, **Bg6** replaces **Kc2**, with r30 as the final deciding rule. The complete reachable proof from that starting position now guarantees mate within 41 plies.

No non-mating counterexample remains reachable from the initial three checked starts. The subsequent clock-42 continuation below supplies the current non-mating witness; no claim is made about unexamined starting positions.

## Current non-mating continuation

[Replay the verified fifty-move draw from the loaded target-priority position](http://localhost:5173/mate/two-bishops#fen=8/8/4K3/8/8/4k3/1B6/1B6_w_-_-_42_22&moves=Kd5,Kd2,Kc4,Ke3,Bc1%2B,Kf3,Kd4,Kg4,Ke5,Kh5,Kf6,Kh4,Kg6,Kg3,Bc2,Kf3,Kf6,Ke2,Ke5,Ke1,Bg6,Kd1,Bh6,Ke2,Kd4,Kd1,Kc3,Ke2,Bh5%2B,Kf2,Bf4,Kg2,Kd3,Kh1,Ke4,Kg2,Kf5,Kh1,Kg5,Kg1,Kh4,Kg2,Bg4,Kf2,Kh3,Kf1,Kg3,Ke1,Bh5,Kf1,Bd2,Kg1,Be2,Kh1,Bf4,Kg1,Be3%2B,Kh1&cursor=0).

Starting FEN: `8/8/4K3/8/8/4k3/1B6/1B6 w - - 42 22`.

The current policy permits this 58-ply continuation, reaching `8/8/8/8/8/4B1K1/4B3/7k w - - 100 51`. Every White move was independently checked against the preferred move set; every Black reply is legal; no earlier ply is terminal. The final outcome is a fifty-move draw, with neither checkmate nor stalemate, and the app's replay decoder accepts the cursor-zero link.

The structural maximum is 59 further plies, with a maximum safe incoming clock of 41. The user's supplied clock of 42 therefore allows a draw one ply before the longest mate. If the cutoff were ignored, **51. Bf3#** would mate on the next ply; that was verified on the same board with a reset clock and is excluded from the playable replay because the app has already ended the game.

This is a permitted policy continuation, not a proof that Black can force it against every tied preferred White choice. It preserves the supplied clock and is not a structural loop or a clock-zero counterexample.

## Playable current mating continuations

These are independently verified example lines, not the maximum-length branches used to establish the table's bounds. Each White move is current-policy preferred, every Black reply is legal, no earlier ply is terminal, and the final move is checkmate. The app's replay decoder accepts all three cursor-zero links.

- [Loaded former four-ply-loop position: a 29-ply mating continuation](http://localhost:5173/mate/two-bishops#fen=8/7B/6K1/8/8/7k/8/2B5_w_-_-_0_1&moves=Kf6,Kg4,Bc2,Kh5,Bd1%2B,Kh4,Be3,Kh3,Kf5,Kh4,Ke4,Kh3,Kd3,Kh4,Kd2,Kh3,Ke1,Kh4,Kf2,Kh3,Bg5,Kh2,Bg4,Kh1,Be3,Kh2,Bf4%2B,Kh1,Bf3%23&cursor=0).
- [Former 18-ply-loop position: a 35-ply mating continuation](http://localhost:5173/mate/two-bishops#fen=8/8/7B/8/3K4/8/8/1B1k4_w_-_-_0_1&moves=Kc3,Ke2,Bg6,Kf3,Kd4,Kg4,Ke5,Kh4,Bc2,Kh5,Bc1,Kh4,Bd1,Kh3,Be3,Kh4,Ke4,Kh3,Kd3,Kh4,Kd2,Kh3,Ke1,Kh4,Kf2,Kh3,Bg5,Kh2,Bg4,Kh1,Be3,Kh2,Bf4%2B,Kh1,Bf3%23&cursor=0).
- [Second former stalemate position: a 15-ply mating continuation](http://localhost:5173/mate/two-bishops#fen=4B2B/8/5K1k/8/8/8/8/8_w_-_-_0_1&moves=Bg7%2B,Kh7,Bf8,Kg8,Be7,Kh8,Kf7,Kh7,Bf8,Kh8,Ba4,Kh7,Bc2%2B,Kh8,Bg7%23&cursor=0).

## Focused validation

The completed change passed **120 policy tests with no TODOs**, **three focused guide checks**, and both app and verifier TypeScript checks. Read-only code review also passed.
