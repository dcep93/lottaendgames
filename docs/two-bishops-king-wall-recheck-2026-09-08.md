# Two Bishops king-wall recheck — 2026-09-08

The king-wall guard selects **Ke5** instead of **Kd5** from `5B2/3k4/8/8/4K3/1B6/8/8 w - - 18 10`. It breaks the preceding 40-ply policy loop, but both former stalemate starts still reach a different four-ply loop. A universal mating guarantee remains unresolved.

In that starting position, the inner wall is **a3–f8** through Bf8 and the outer wall is **a2–g8** through Bb3. **Kd5** steps onto the outer wall and screens Bb3's ray. **Ke5** is on **a1–h8**, one diagonal beyond the outer wall, and does not screen either bishop. Both moves previously scored five Black diagonals and one king step to target e6; the new guard penalizes Kd5 and leaves Ke5 eligible. As a geometry diagnostic, holding White's pieces fixed after Kd5 permits Black's route Ke8–f7–g6 through the screened ray. After Ke5, f7 remains bishop-controlled. This route illustrates the screen; it is not a forced alternating move sequence.

The guard follows the three universal priorities—checkmate, bishop safety, and avoiding stalemate—and precedes r3 and the remaining positional rules. It penalizes a king move onto either line of any starting pair of adjacent parallel bishop diagonals unless the destination is **exactly one square from the nearest board edge** (`edgeDistance === 1`). Edge squares themselves have distance zero and do not qualify. Both diagonal orientations are checked, including short pairs excluded from r10's enclosure-size calculation. Bishop moves and king moves off the walls are unaffected; moving from one wall square onto another central wall square is penalized. This orders policy choices without changing chess legality.

Fresh production-adapter searches considered every preferred White choice and every legal Black reply, using a separate empty proof map for each start and halfmove clock zero. Each had a 1,500-position limit; all found a cycle before reaching it. No persisted census expansions or proofs were reused, and no full census was run. Fingerprints were unchanged before and after the checks:

- Engine: `12d2647dc3b8407c37ff489627fa99fa5fd922568b6da30e9853a58c388922eb`
- Policy: `a19680c64d4c06e7d29b5f6928bf0ef665183d23e9f4f6bd4beb49dcfb8199a0`

| Starting FEN | Initial preferred move | Result | Expanded canonical positions / White choices | Black replies |
| --- | --- | --- | --- | --- |
| `8/8/6B1/8/4K3/8/8/2Bk4 w - - 0 1` | Bh6 | Cycle reachable | 39 / 39 | 87 |
| `4Bk1B/8/5K2/8/8/8/8/8 w - - 0 1` | Ba4 | Cycle reachable | 46 / 46 | 82 |
| `4B2B/8/5K1k/8/8/8/8/8 w - - 0 1` | Bg7+ | Cycle reachable | 49 / 49 | 87 |

These totals describe work before finding a counterexample, not complete reachable-graph counts. No selected move had a king-wall penalty in any of these searches.

Both former stalemate starts reach `8/8/8/8/8/4B3/6k1/3BK3 w - - 0 1`, with **Be2 Kg3 Bd1 Kg2**. [Replay the verified four-ply loop](http://localhost:5173/mate/two-bishops#fen=8/8/8/8/8/4B3/6k1/3BK3_w_-_-_0_1&moves=Be2,Kg3,Bd1,Kg2&cursor=0). Be2 and Bd1 are each the sole preferred White move, both decided by **r6**. Every move is legal, no ply reaches a terminal position, the exact starting board repeats, and the replay decoder accepts the link. The first listed root reaches the reflected version of this same loop.

The [equal-distance target recheck](two-bishops-equal-target-recheck-2026-09-08.md) records the preceding policy and its historical 40-ply loop. Under this revision, that replay first diverges at ply 5: Be3 replaces Kf3. The known failing universal-mate TODO remains unresolved because the new r6 loop still defeats termination; a passing focused test suite must not be reported as a universal mating proof.
