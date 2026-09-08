# Two Bishops outer-wall screening recheck — 2026-09-08

R10 now treats a centrally screened outer wall as providing **no enclosure** (`99`), even when Black cannot immediately reach its hidden tail. This changes which bishop walls constrain Black's diagonal count; it adds no global king-movement guard. A screened inner wall still adds its diagonal to Black's count when the outer wall remains intact. The existing exception for a White king on the edge or one square from it is preserved.

In the user's position, `5B2/3k4/8/8/4K3/1B6/8/8 w - - 18 10`, **Kd5** screens the outer wall **a2–g8**, so it no longer receives an enclosure score. **Ke5** remains outside both walls and is the sole preferred move. R10 eliminates Kd5; Ke5 and Kf5 each retain five diagonals and are one step from target e6, so r25 chooses Ke5 over Kf5. The move log therefore still labels the final choice r25.

These checks used the current production adapter, every tied preferred White move, and every legal Black reply. Each root received a fresh proof map, with no earlier census expansions or persisted proofs. This was a bounded diagnostic recheck, not a new exhaustive census of all starting positions. For a verified row, the complete reachable graph from that root was proved and its maximum mating bound includes every policy branch. Failed rows provide counterexamples; their counts describe only the work performed before finding that counterexample.

- Engine fingerprint: `12d2647dc3b8407c37ff489627fa99fa5fd922568b6da30e9853a58c388922eb`
- Policy fingerprint: `766b52432a7055f7c259221536001a9bf971bb276719eb953caf723392113c7e`
- Fingerprints were unchanged before and after the checks, including the policy help-note revision.

| Starting FEN | Initial preferred move / deciding rule | Result | Expanded canonical positions | White choices | Black replies |
| --- | --- | --- | ---: | ---: | ---: |
| `5B2/3k4/8/8/4K3/1B6/8/8 w - - 18 10` | Ke5 / r25 | Guaranteed mate within 33 further plies; starting clock 18 | 95 | 95 | 232 |
| `8/8/6B1/8/4K3/8/8/2Bk4 w - - 0 1` | Bg5 / r10 | Guaranteed mate within 47 plies | 312 | 312 | 1,009 |
| `4B2B/8/5K1k/8/8/8/8/8 w - - 0 1` | Bg7+ / r3 | Guaranteed mate within 93 plies | 1,329 | 1,329 | 4,846 |
| `4Bk1B/8/5K2/8/8/8/8/8 w - - 0 1` | Ba4 / r30 | Structural mating proof, but a fifty-move draw is reachable at ply 100 | 1,915 | 1,920 | 7,569 |
| `8/8/6B1/8/8/5K1k/3B4/8 w - - 0 1` | Bh5 / r12 | Four-ply cycle | 2 | 2 | 3 |

The first three roots completed within a 1,500-position cap. The first former stalemate root initially reached that cap without a conclusion; a fresh check with a 5,000-position cap completed at 1,915 positions and found the draw. Those final counts exclude the abandoned capped attempt. The cycle check used a 100-position cap and completed at two positions. No cap was reached in the reported final results.

The [earlier 40-ply loop](two-bishops-equal-target-recheck-2026-09-08.md) now breaks on its first White move: **Bh6** receives diagonal count `99`, while preferred **Bg5** receives `10`. The complete reachable proof from its starting position now guarantees mate within 47 plies.

## Remaining loop

[Replay Bh5 Kh4 Bg6 Kh3 from cursor zero](http://localhost:5173/mate/two-bishops#fen=8/8/6B1/8/8/5K1k/3B4/8_w_-_-_0_1&moves=Bh5,Kh4,Bg6,Kh3&cursor=0).

The first White move is selected by **r12**, the second by **r10**. Both are sole preferred moves. All four plies are legal and nonterminal; the exact physical board and side to move repeat after four plies. The replay decoder accepts the link. Continued repetition therefore cannot guarantee checkmate.

## Remaining fifty-move draw

[Replay the verified 100-ply draw line from the first former stalemate position](http://localhost:5173/mate/two-bishops#fen=4Bk1B/8/5K2/8/8/8/8/8_w_-_-_0_1&moves=Ba4,Kg8,Bg7,Kh7,Bf8,Kg8,Ke7,Kh7,Bb3,Kg6,Ke8,Kf6,Ba3,Ke5,Ke7,Kd4,Kd7,Kc3,Bg8,Kd4,Kc6,Kc3,Kb5,Kc2,Bf8,Kd3,Bg7,Ke4,Kc5,Kf5,Kd6,Kg6,Bb2,Kh6,Ba2,Kg6,Ke7,Kg5,Bb1,Kf4,Bc2,Ke3,Ke6,Kd2,Bg6,Ke3,Kd5,Kd2,Kc4,Kd1,Bg7,Kc1,Kb3,Kd2,Bh6%2B,Ke2,Kc2,Kf3,Kc3,Kg4,Kd4,Kh4,Bc2,Kh5,Bc1,Kg4,Ke5,Kh5,Kf6,Kh4,Bd1,Kh3,Be3,Kh4,Kf5,Kh3,Ke4,Kh4,Kd3,Kh3,Kd2,Kh2,Ke1,Kg2,Be2,Kg3,Kf1,Kh3,Kf2,Kh4,Bd1,Kh3,Bg5,Kh2,Bg4,Kh1,Be3,Kh2,Bf4%2B,Kh1&cursor=0).

Every White move was independently checked against the current production preference. Every move is legal, no earlier ply is terminal, and the final position is `8/8/8/8/5BB1/8/5K2/7k w - - 100 51`. The app classifies it as a fifty-move draw, with neither checkmate nor stalemate. The replay decoder accepts the complete 100-ply link.

The second former stalemate start now has a successful mating proof, so its former failing TODO can become a normal passing test. This does not establish a universal mating guarantee: the separate four-ply loop and hundred-ply draw remain current counterexamples.
