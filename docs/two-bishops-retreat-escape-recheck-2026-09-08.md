# Two Bishops retreat and escape recheck — 2026-09-08

Both former stalemate starts now have finite structural mating proofs, but the first can exceed the fifty-move limit. The second still guarantees mate within the limit, with a new maximum of **89 plies**, not the previous 15.

These are fresh checks of the current production policy after the r4 retreat pattern and r10 wall-escape changes. Each proof includes every tied preferred White move and every legal Black reply, starting with halfmove clock zero. No previous census expansions or proofs were reused.

R4 accepts all four Be8 retreats along a4–e8: Bd7, Bc6, Bb5, and Ba4. Every one forces Black to g8; later priorities select Ba4. The pattern is recognized under all eight board symmetries. R10 now gives a wall no enclosure credit when Black can cross beyond both walls on its next move, including escapes to a smaller side. Landing on the outer wall remains distinct and still counts that diagonal once.

Checked at `2026-09-08T19:00:15.972Z`.

- Engine fingerprint: `12d2647dc3b8407c37ff489627fa99fa5fd922568b6da30e9853a58c388922eb`
- Policy fingerprint: `d5568908285443389018e65db37a72be5c6e434fd5a04c18b1eed370c64e9940`

The [earlier r3 recheck](two-bishops-r3-recheck-2026-09-08.md), for policy `e4f26971337094e857bb0d42fae2d3eee01820781d52eb7b4e368e46438e26c3`, is historical. Its remaining-stalemate result and 15-ply guarantee no longer describe the current policy. The earlier full census for policy `9572ceb427b06fb476400e8a59d106152dfc6de518309dad87aaa1f942861a97` is also historical. No new full census was run; this report establishes outcomes only for the two starts below.

| Starting FEN | Preferred first move | Maximum structural mate plies | Actual outcome on the longest checked line | White positions / choices | Black replies |
| --- | --- | --- | --- | --- | --- |
| `4Bk1B/8/5K2/8/8/8/8/8 w - - 0 1` | `Ba4`, rule r30 | 101 | fifty-move | 1788 / 1792 | 6956 |
| `4B2B/8/5K1k/8/8/8/8/8 w - - 0 1` | `Bg7+`, rule r3 | 89 | checkmate | 1253 / 1253 | 4529 |

For the first start, **1. Ba4** is preferred. The structural policy graph reaches mate on every continuation within 101 plies, but a permitted line reaches **50 moves / 100 plies without mate**, so the app declares a fifty-move draw. The proof's safe incoming halfmove-clock limit is `-1`: even starting at zero does not guarantee mate before the draw limit. The verified draw line ends **49. Be3 Kh2 50. Bf4+ Kh1**. Final FEN: `8/8/8/8/5BB1/8/5K2/7k w - - 100 51`.

[Replay the complete 100-ply draw](http://localhost:5173/mate/two-bishops#fen=4Bk1B/8/5K2/8/8/8/8/8_w_-_-_0_1&moves=Ba4,Kg8,Bg7,Kh7,Bf8,Kg8,Ke7,Kh7,Bb3,Kg6,Ke8,Kf6,Ba3,Ke5,Kd7,Kd4,Kc6,Kc3,Bg8,Kc2,Bf8,Kc3,Kb5,Kb2,Ka4,Kc3,Bg7%2B,Kd3,Kb4,Ke4,Kc5,Kf5,Kd6,Kg6,Bb2,Kh6,Ba2,Kg6,Ke7,Kh7,Kf8,Kh6,Bb1,Kg5,Bc2,Kf4,Kf7,Ke3,Ke6,Kd2,Bg6,Ke3,Kd5,Kd2,Kc4,Kd1,Bg7,Kc1,Kb3,Kd2,Bh6%2B,Ke2,Kc3,Kf3,Kd4,Kg4,Ke5,Kh4,Bc2,Kh5,Bc1,Kh4,Bd1,Kh3,Be3,Kh4,Ke4,Kh3,Kd3,Kh4,Kd2,Kh3,Ke1,Kg2,Be2,Kg3,Kf1,Kh3,Kf2,Kh4,Bd1,Kh3,Bg5,Kh2,Bg4,Kh1,Be3,Kh2,Bf4%2B,Kh1&cursor=0).

For the second start, **1. Bg7+** remains preferred. Every policy continuation mates within **89 plies** from halfmove clock zero. The worst-case proof permits an incoming halfmove clock up to 11, because mate on ply 100 takes precedence over the draw. The verified longest line ends **43. Be3 Kh2 44. Bf4+ Kh1 45. Bf3#**. Final FEN: `8/8/8/8/5B2/5B2/5K2/7k b - - 89 45`.

[Replay the complete 89-ply mate](http://localhost:5173/mate/two-bishops#fen=4B2B/8/5K1k/8/8/8/8/8_w_-_-_0_1&moves=Bg7%2B,Kh7,Bf8,Kg8,Ke7,Kh7,Bf7,Kh8,Ke8,Kh7,Ba3,Kh6,Bb2,Kg5,Ba2,Kf5,Ke7,Ke4,Kd6,Kd3,Kc5,Kc2,Bg7,Kc1,Bg8,Kc2,Kb4,Kb1,Ka3,Kc2,Bh7%2B,Kd2,Bg6,Ke3,Kb3,Kf4,Kc4,Kg5,Bc2,Kh5,Bb2,Kh6,Kd5,Kg5,Ke6,Kh6,Kf7,Kh5,Bc1,Kg4,Kf6,Kf3,Ke5,Ke2,Kd4,Ke1,Bg6,Kf2,Bh5,Kg3,Ke4,Kh4,Bd1,Kh3,Be3,Kh4,Kd3,Kh3,Kd2,Kh2,Ke1,Kg2,Be2,Kg3,Kf1,Kh3,Kf2,Kh4,Bd1,Kh3,Bg5,Kh2,Bg4,Kh1,Be3,Kh2,Bf4%2B,Kh1,Bf3%23&cursor=0).

Both lines were replayed move by move with the current production policy. Every White move is preferred and every Black move is legal. The first line has no earlier terminal position and ends with `fifty-move`; the second ends with `checkmate`. Both links passed `encodeMateReplay` / `decodeMateReplay` with `cursor=0`. Source fingerprints matched before and after verification.

## Bf3+ and the king moves

From `8/8/8/3k4/8/8/4B3/2K3B1 w - - 20 11`, Bf3+ no longer receives enclosure credit: Kc4 crosses the a8–h1 inner wall and a7–g1 outer wall into the opposite side. R10 uses its no-enclosure score of 99, so the move loses to a valid eight-diagonal enclosure.

Kc2 and Kd2 both retain inner wall a7–g1, outer wall a6–f1, eight diagonals, zero edge penalty, and target c4 two king steps away. Kd2 wins under r25: it is three straight-line units from Black on d5, compared with √10 for Kc2. No target or proximity rule was changed.
