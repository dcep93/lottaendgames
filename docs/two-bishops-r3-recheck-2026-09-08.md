# Two Bishops r3 recheck — 2026-09-08

The revised r3 resolves the second former stalemate start below. The first still reaches stalemate. These are fresh checks of the current production policy, including every tied preferred White move and every legal Black reply. No cached census expansions or proofs were reused.

Checked at `2026-09-08T18:49:39.068Z`.

- Engine fingerprint: `12d2647dc3b8407c37ff489627fa99fa5fd922568b6da30e9853a58c388922eb`
- Policy fingerprint: `e4f26971337094e857bb0d42fae2d3eee01820781d52eb7b4e368e46438e26c3`

The earlier exhaustive census, for policy `9572ceb427b06fb476400e8a59d106152dfc6de518309dad87aaa1f942861a97`, is historical. Its universe-wide outcomes do not establish the outcomes of the revised policy. This report checks only the two starts listed here; no new exhaustive census was run.

| Starting FEN | Fresh result | Preferred first move | White positions / choices | Black replies | Maximum mate length |
| --- | --- | --- | --- | --- | --- |
| `4Bk1B/8/5K2/8/8/8/8/8 w - - 0 1` | Stalemate witness | `Bg6`, r10 | 2 / 2 | 1 | Not proved |
| `4B2B/8/5K1k/8/8/8/8/8 w - - 0 1` | Every policy continuation mates | `Bg7+`, r3 | 8 / 8 | 7 | 15 plies |

The first start still plays **1. Bg6 Kg8 2. Bg7**, ending in stalemate. R10 selects `Bg6`; the bishop-safety priority selects `Bg7`. Final FEN: `6k1/6B1/5KB1/8/8/8/8/8 b - - 3 2`.

The h8 bishop can initially move only to g7, which permits `Kxe8`. The higher bishop-safety rule therefore excludes that move before r3. Every surviving first move retains the corner bishop and ties r3. After `Bg6 Kg8`, `Bg7` is the only bishop-safe move; all fourteen alternatives permit a bishop capture. Avoiding this stalemate requires choosing a different first move, which the requested r3 change alone does not do.

[Replay the remaining stalemate](http://localhost:5173/mate/two-bishops#fen=4Bk1B/8/5K2/8/8/8/8/8_w_-_-_0_1&moves=Bg6,Kg8,Bg7&cursor=0).

The second start's longest proved mating line is **1. Bg7+ Kh7 2. Bg6+ Kg8 3. Bh6 Kh8 4. Bf5 Kg8 5. Kg6 Kh8 6. Bb1 Kg8 7. Ba2+ Kh8 8. Bg7#**. The verifier proves the maximum of 15 plies over all selected White choices and legal Black replies. Final FEN: `7k/6B1/6K1/8/8/8/B7/8 b - - 15 8`.

[Replay the longest proved mate](http://localhost:5173/mate/two-bishops#fen=4B2B/8/5K1k/8/8/8/8/8_w_-_-_0_1&moves=Bg7%2B,Kh7,Bg6%2B,Kg8,Bh6,Kh8,Bf5,Kg8,Kg6,Kh8,Bb1,Kg8,Ba2%2B,Kh8,Bg7%23&cursor=0).

Both lines were replayed with legal moves. Every White move remains preferred by the production policy. The final positions were independently checked with `isStalemate()` and `isCheckmate()` respectively, and both links passed `encodeMateReplay` / `decodeMateReplay` with `cursor=0`. The source fingerprints matched before and after verification.

## Kc2 comparison

From `8/8/8/3k4/8/8/4B3/2K3B1 w - - 20 11`, the revised policy still selects `Bf3+`. Both moves have r3 penalties `(0, 0, 0)`. R10 compares diagonal count before target proximity:

| White move | Inner wall | Outer wall | Black diagonals | Targets | White king steps |
| --- | --- | --- | --- | --- | --- |
| Bf3+ | a8–h1 | a7–g1 | 7 | c5, d4 | 3 |
| Kc2 | a7–g1 | a6–f1 | 8 | c4 | 2 |

Both profiles use target corner h8 and have zero r10 edge penalty. After `Bf3+`, Black can cross to the other side with `Kc4`; r10 takes the larger of seven diagonals toward h8 and six toward a1. `Kc2 Ke4` is legal, but the better target distance does not overcome the eight-versus-seven diagonal comparison.
