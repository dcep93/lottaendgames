# Two Bishops equal-distance target recheck — 2026-09-08

Allowing an outer-wall target when White's king is **no farther** from it than Black's king selects **Kb4** in the user's current position, `5BB1/8/8/1K6/8/8/1k6/8 w - - 24 13`. However, both former stalemate starts now admit a repeating policy line. Neither has a universal mating bound under this revision.

These are fresh production-adapter checks of every tied preferred White move and every legal Black reply, starting at halfmove clock zero. Each start used a new proof map; no prior census expansions or persisted proofs were reused. No full census was run. The earlier [retreat and escape recheck](two-bishops-retreat-escape-recheck-2026-09-08.md), with bounds of 101 and 89 plies, describes the preceding policy only.

- Engine fingerprint: `12d2647dc3b8407c37ff489627fa99fa5fd922568b6da30e9853a58c388922eb`
- Policy fingerprint: `1089f83618aae8ddc4756386e9a5de8b81bc070fb167f7a2ffc61853d061f783`

| Starting FEN | Initial preferred move / deciding rule | Result | Universal maximum mate plies | Expanded canonical positions / White choices | Black replies |
| --- | --- | --- | --- | --- | --- |
| `4Bk1B/8/5K2/8/8/8/8/8 w - - 0 1` | `Ba4`, r30 | Cycle reachable | No finite bound | 417 / 417 | 1,299 |
| `4B2B/8/5K1k/8/8/8/8/8 w - - 0 1` | `Bg7+`, r3 | Cycle reachable | No finite bound | 360 / 360 | 1,110 |

The state and reply totals are work performed before finding each counterexample, not a complete census of either reachable graph. Both searches find the same loop starting at `8/8/6B1/8/4K3/8/8/2Bk4 w - - 0 1`. The first 20 plies return to a rotated equivalent; continuing in the corresponding physical orientation returns to the exact starting board after **40 plies**.

[Replay the verified 40-ply loop](http://localhost:5173/mate/two-bishops#fen=8/8/6B1/8/4K3/8/8/2Bk4_w_-_-_0_1&moves=Bh6,Kc2,Bh5,Kb3,Kf3,Ka4,Bg6,Ka5,Bg7,Kb6,Bf7,Kc7,Bf8,Kd7,Ke4,Kd8,Bb3,Kd7,Kd5,Ke8,Ba3,Kf7,Ba4,Kg6,Kc6,Kh5,Bb3,Kh4,Bb2,Kg3,Bc2,Kf2,Bc1,Ke2,Kd5,Ke1,Bg6,Ke2,Ke4,Kd1&cursor=0).

Every replay move is legal, every White move is production-preferred, no ply reaches a terminal position, the physical starting position repeats, and the app's replay decoder accepts the link. Continuing the loop therefore cannot guarantee checkmate; eventual repetition or the fifty-move rule supplies a draw.

The focused tests cover closer, equal, and farther target distances, occupancy invalidation, tied candidates, and Kb4 under all eight symmetries. The former universal-mate test is retained as a known failing TODO, linked to this report; it must not be described as a passing mating proof. Its eventual success condition is mate before the draw limit, rather than the preceding policy's exact 89-ply maximum.
