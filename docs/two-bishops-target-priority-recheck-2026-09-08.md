# Two Bishops target-priority recheck — 2026-09-08

R10 now compares **Black's diagonal count, then White's king-step distance to a target, then the existing bishop corner-edge penalty**. Wall qualification, target discovery, and the Phase 2 edge exception are unchanged.

From the loaded position, `8/8/4K3/8/8/4k3/1B6/1B6 w - - 42 22`, **Kd5** is now the sole preferred move, decided by **r10**. Kd5 and the old Bg6 retain six diagonals and target d4; Kd5 is one king step from d4, compared with two for Bg6. The remaining bishop on the corner edge no longer overrides that improvement.

## Scope and results

Each root used a fresh production adapter and an empty proof map. No historical census expansions or persisted proofs were reused. The verifier considers every tied preferred White move and every legal Black reply, stopping at the first counterexample. The caps below were diagnostic limits, not a new census. All four checks returned a conclusive result below their caps; no wider search was run.

- Engine fingerprint: `12d2647dc3b8407c37ff489627fa99fa5fd922568b6da30e9853a58c388922eb`
- Policy fingerprint: `86c14d749591dde19172b7dcad420a22d2b63dfebc8ec5afafa4e73008bba1ae`
- Fingerprints stayed unchanged through the proof checks and independent replay validation.

| Starting FEN | Initial preferred move / final deciding rule | Result | Cap | Expanded canonical positions | White choices | Black replies |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| `8/8/4K3/8/8/4k3/1B6/1B6 w - - 42 22` | Kd5 / r10 | Structural cycle reachable; no finite universal mating bound | 2,500 | 702 | 704 | 2,668 |
| `4Bk1B/8/5K2/8/8/8/8/8 w - - 0 1` | Ba4 / r30 | Structural cycle reachable; previous 101-ply mating bound no longer applies | 5,000 | 823 | 823 | 2,831 |
| `4B2B/8/5K1k/8/8/8/8/8 w - - 0 1` | Bg7+ / r3 | Structural cycle reachable; previous 93-ply mating bound no longer applies | 2,500 | 665 | 665 | 2,477 |
| `8/8/6B1/8/8/5K1k/3B4/8 w - - 0 1` | Be3 / r22 | Guaranteed mate within 55 plies | 1,500 | 328 | 328 | 977 |

Cycle-row totals measure work before finding a counterexample, not full enumeration of each reachable graph. The 55-ply result is a complete reachable proof, including every policy branch. Structural cycle detection ignores the clock while finding repetition; the loaded root retains its supplied clock of 42, so its continuation may meet the draw cutoff before reaching or completing a cycle. The standalone witness replays below start at clock zero and were verified as fully playable.

## Short current loop

[Replay Bd2 Kh4 Bc1 Kh3 from cursor zero](http://localhost:5173/mate/two-bishops#fen=8/7B/6K1/8/8/7k/8/2B5_w_-_-_0_1&moves=Bd2,Kh4,Bc1,Kh3&cursor=0).

Starting FEN: `8/7B/6K1/8/8/7k/8/2B5 w - - 0 1`.

Both White moves are sole preferred moves, selected by **r30**. All four plies are legal and nonterminal, and the exact physical board and side to move repeat. The app's replay decoder accepts the link. This short loop uses an alternative legal Black route within the 12-ply cycle found from the first former stalemate root; no additional search was needed to shorten it.

## Loaded-position and second-root witness

[Replay the verified 18-ply loop from cursor zero](http://localhost:5173/mate/two-bishops#fen=8/8/7B/8/3K4/8/8/1B1k4_w_-_-_0_1&moves=Kc3,Ke1,Kc2,Ke2,Bg5,Kf2,Bh6,Kg2,Bc1,Kh2,Bd2,Kg3,Kc3,Kf3,Kd4,Ke2,Bh6,Kd1&cursor=0).

Starting FEN: `8/8/7B/8/3K4/8/8/1B1k4 w - - 0 1`.

Line: **Kc3 Ke1 Kc2 Ke2 Bg5 Kf2 Bh6 Kg2 Bc1 Kh2 Bd2 Kg3 Kc3 Kf3 Kd4 Ke2 Bh6 Kd1**.

Fresh checks from the loaded position and the second former stalemate root both found this cycle. Every White move is sole preferred; all 18 plies are legal and nonterminal; the exact physical board and side to move repeat. The replay decoder accepts the link. Its White deciding rules are r10, r10, r30, r30, r30, r30, r25, r10, and r30, respectively.

## Previous draw line and proof-test status

The [previous 100-ply draw replay](two-bishops-wall-qualification-recheck-2026-09-08.md) first stops following the policy at **ply 41**. In `8/4K3/8/8/5k2/8/1B6/1B6 w - - 40 21`, the old **21. Bc2** is replaced by **21. Ke6**, with r25 resolving the final tie. Both retain six diagonals and target e5; Ke6 is one step from the target, versus two for Bc2, so the new r10 priority admits Ke6 despite its edge penalty.

That breaks the old draw line but does not restore a mating guarantee: both former stalemate roots now admit structural loops. The second-root universal-mate test therefore fails for a current policy counterexample, rather than merely an outdated exact mating length. If retained as a TODO, it must remain explicitly linked to this report and must not be presented as a passing mating proof.
