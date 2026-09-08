# Two Bishops wall-qualification recheck — 2026-09-08

A central White king screen on **either** bishop diagonal now disqualifies that pair before r10/r12 receive its diagonal count, target squares, or one-beyond-wall distance. A White king one square from the edge remains exempt, and a king at a diagonal endpoint has no continuing ray to screen. Independently valid wall orientations remain available. This changes wall qualification, without adding a global king-movement guard or changing the other template rules.

The preceding [Bh5 Kh4 Bg6 Kh3 loop](two-bishops-outer-screen-recheck-2026-09-08.md) breaks immediately. From `8/8/6B1/8/8/5K1k/3B4/8 w - - 0 1`, the sole preferred move is now **Be3**, with **r22** as the final deciding rule. After Bh5, Kf3 screens inner diagonal d1–h5; that pair supplies no enclosure, target, or beyond-wall credit. Bh5 scores `99` for both the r10 diagonal count and r12 distance, whereas Be3 retains five diagonals and a two-step beyond-wall distance.

## Scope and results

All checks used fresh production adapters and a new proof map for each root, without reusing previous census expansions or persisted proofs. Every tied preferred White move and every legal Black reply was included. The first four roots were capped at 1,500 canonical positions, and the final root at 2,500. Each completed below its cap. These are complete reachable proofs from the five listed roots, not a new exhaustive census of all possible starts.

- Engine fingerprint: `12d2647dc3b8407c37ff489627fa99fa5fd922568b6da30e9853a58c388922eb`
- Policy fingerprint: `5e3d7861ce53d8e1c563b98fd351573f8563c57ccdea9164123abc346ac67343`
- Fingerprints were unchanged before and after the checks.

| Starting FEN | Initial preferred move / final deciding rule | Current result | Expanded canonical positions | White choices | Black replies |
| --- | --- | --- | ---: | ---: | ---: |
| `8/8/6B1/8/8/5K1k/3B4/8 w - - 0 1` | Be3 / r22 | Guaranteed mate within 55 plies | 328 | 328 | 977 |
| `5B2/3k4/8/8/4K3/1B6/8/8 w - - 18 10` | Ke5 / r25 | Guaranteed mate within 33 further plies, including starting clock 18 | 95 | 95 | 232 |
| `8/8/6B1/8/4K3/8/8/2Bk4 w - - 0 1` | Bg5 / r10 | Guaranteed mate within 47 plies | 312 | 312 | 1,009 |
| `4B2B/8/5K1k/8/8/8/8/8 w - - 0 1` | Bg7+ / r3 | Guaranteed mate within 93 plies | 1,329 | 1,329 | 4,846 |
| `4Bk1B/8/5K2/8/8/8/8/8 w - - 0 1` | Ba4 / r30 | Maximum structural mate length 101 plies; a fifty-move draw occurs first at ply 100 | 1,915 | 1,920 | 7,569 |

The earlier 40-ply loop remains broken: its starting position now guarantees mate within 47 plies. No structural cycle remains reachable from any of these five checked starts. That does not establish the absence of loops elsewhere. The remaining draw supplies a current counterexample to a universal guarantee of checkmate before the draw limit, so the bounded search stopped there.

## Current non-mating witness

[Replay the verified 100-ply draw line from cursor zero](http://localhost:5173/mate/two-bishops#fen=4Bk1B/8/5K2/8/8/8/8/8_w_-_-_0_1&moves=Ba4,Kg8,Bg7,Kh7,Bf8,Kg8,Ke7,Kh7,Bb3,Kg6,Ke8,Kf6,Ba3,Ke5,Ke7,Kd4,Kd7,Kc3,Bg8,Kd4,Kc6,Kc3,Kb5,Kc2,Bf8,Kd3,Bg7,Ke4,Kc5,Kf5,Kd6,Kg6,Bb2,Kh6,Ba2,Kg6,Ke7,Kg5,Bb1,Kf4,Bc2,Ke3,Ke6,Kd2,Bg6,Ke3,Kd5,Kd2,Kc4,Kd1,Bg7,Kc1,Kb3,Kd2,Bh6%2B,Ke2,Kc2,Kf3,Kc3,Kg4,Kd4,Kh4,Bc2,Kh5,Bc1,Kg4,Ke5,Kh5,Kf6,Kh4,Bd1,Kh3,Be3,Kh4,Kf5,Kh3,Ke4,Kh4,Kd3,Kh3,Kd2,Kh2,Ke1,Kg2,Be2,Kg3,Kf1,Kh3,Kf2,Kh4,Bd1,Kh3,Bg5,Kh2,Bg4,Kh1,Be3,Kh2,Bf4%2B,Kh1&cursor=0).

Starting FEN: `4Bk1B/8/5K2/8/8/8/8/8 w - - 0 1`.

Every White move was independently rechecked against the current production preferences. All 100 plies are legal, no earlier ply is terminal, and the final position is `8/8/8/8/5BB1/8/5K2/7k w - - 100 51`. The app identifies a fifty-move draw, with neither checkmate nor stalemate; its replay decoder accepts the complete link.

If the draw cutoff were ignored, **51. Bf3#** would mate at ply 101. This continuation was verified on the same board with the halfmove clock reset for the structural check. It is deliberately excluded from the playable replay, because the app has already ended the game at ply 100.
