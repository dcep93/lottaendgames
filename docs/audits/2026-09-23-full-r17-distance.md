# Full bishop-and-knight audit

Audit artifacts: `/Users/danielcepeda/repos/_codex_output/bn-full-2026-09-23-r17-distance`. All 1,513,166 history states were expanded. Production-equivalence and D4 checks passed; 20 scaffold tests passed; all 350 component witnesses replayed from fresh starts.

## Comparison with the previous full audit

All position counts in this comparison are D4-deduplicated.

| Metric | Previous | Current |
|---|---:|---:|
| Cyclic components | 605 | 350 |
| Positions directly on a history-aware loop | 1,119 | 641 |
| Supported positions directly on a loop | 2 | 0 |
| Unsupported positions that can reach a loop | 36,757 | 41,862 |
| Supported positions that can reach a loop | 5 | 2 |
| Nonmating support-loss transitions | 30 | 30 |

Direct cyclic positions decreased 42.7%, but unsupported loop reachability increased from 2.1557% to 2.4543% of physical unsupported placements. A replay of the previous 605 witnesses found 218 still repeating and 387 broken; that replay count is not the new graph's component count.

For reducing loop reachability, the two largest components share White Kd4, Nd5, and a bishop shuttling between c6 and a8, with Black near the a8 corner. Their combined reachability is 96,600 physical starting placements (28.9% of all loop-reaching starts). This union is not a guarantee that a rule change will eliminate those paths; the changed continuations must be audited.

Policy commit: `0205bf45031c0133c0f82a5b59b1c4f169d88469`. Snapshot fingerprint: `ff78adbf69c7ce8da9ea6432e47832ea71bfde0391f856015c1d8a41d29bdc8b`.

All 13,660,584 post-White placements, reduced to 1,707,888 actual D4 orbits. Counts below distinguish D4 orbits from physical board orientations; no blanket division by eight. Every tied best White move and app-selected Black reply is followed through changes of support. Black's previous-White-position return history is retained.

## Loops by starting support status

| Starting status | D4 positions | Physical positions | Directly on a loop, D4 / physical | Can reach a loop, D4 / physical | Direct-loop % of physical starts | Reach-loop % of physical starts |
|---|---:|---:|---:|---:|---:|---:|
| all | 1,707,888 | 13,660,584 | 641 / 5,128 | 41,864 / 334,808 | 0.0375% | 2.4509% |
| supported | 2,462 | 19,696 | 0 / 0 | 2 / 16 | 0.0000% | 0.0812% |
| unsupported | 1,705,426 | 13,640,888 | 641 / 5,128 | 41,862 / 334,792 | 0.0376% | 2.4543% |
| 7 | 1,443 | 11,544 | 0 / 0 | 0 / 0 | 0.0000% | 0.0000% |
| 5 | 723 | 5,784 | 0 / 0 | 2 / 16 | 0.0000% | 0.2766% |
| 3 | 296 | 2,368 | 0 / 0 | 0 / 0 | 0.0000% | 0.0000% |

350 cyclic components after D4 deduplication. 0 contain a supported board on the cycle; 1 are reachable from a fresh supported start; 1 are reachable after support anywhere in the history-aware graph. Direct membership means that the board occurs on a history-aware cycle; it does not necessarily mean that its history-free Black reply reenters that same cycle. The stricter count is retained as directLoopFromFreshStart in the JSON. A component may contain several simple loops; these are component counts, not a count of all possible simple cycles.

## Support-losing best White moves

A loss means the last White result was supported and the next White result is unsupported. Black's reply does not itself reclassify support. Transition deduplication applies one shared D4 transformation to the prior White result, current White-turn board, and next White result.

| Transition outcome | Distinct transitions, D4 / physical | Distinct supported source boards, D4 / physical |
|---|---:|---:|
| Nonmating support losses | 30 / 240 | 30 / 240 |
| Loss on a mating move | 4 / 32 | 4 / 32 |
| Losses with playable examples | 32 / 256 | 32 / 256 |
| Census-only examples | 2 / 16 | 2 / 16 |
| No legal move retains support (nonmating losses) | 26 / 208 | 26 / 208 |
| A legal move retains support (nonmating losses) | 4 / 32 | 4 / 32 |
| A support-preserving move avoids immediate capture/stalemate | 0 / 0 | 0 / 0 |
| No support-preserving move avoids immediate capture/stalemate | 30 / 240 | 30 / 240 |
| A loop is reachable after the loss | 2 / 16 | 2 / 16 |
| Mate is reachable after the loss | 32 / 256 | 32 / 256 |
| Capture/stalemate is reachable after the loss | 0 / 0 | 0 / 0 |

Reachable outcomes overlap when tied choices have different endings. Sources are post-White boards, so several Black replies or subsequent White moves can share one source. A source counted here can occur after earlier moves with history; it need not lose support under its fresh-start reply.

| Previous support | Nonmating loss transitions, D4 / physical | Source boards, D4 / physical |
|---|---:|---:|
| 3 | 2 / 16 | 2 / 16 |
| 5 | 20 / 160 | 20 / 160 |
| 7 | 8 / 64 | 8 / 64 |

### Support-loss piece-position motifs

These groups use the placement before Black replies. The moved piece is included to identify the action to inspect. Source counts can overlap across groups. There are 26 distinct nonmating White decisions after dropping the preceding Black-reply context. A replay starts before the support-losing White move, with a short legal lead-in where necessary; the recorded prior White result is available in `support-loss-events.json`.

| Motif | Transitions, D4 | Sources, D4 | Example loss |
|---|---:|---:|---|
| 5-diagonal; Noncentral bishop not king-protected; edge king; knight unprotected by king; K moves | 8 | 8 | [1. Ke7](http://localhost:5173/mate/bishop-knight#fen=4K3/2k5/8/1B6/8/2N5/8/8_w_-_-_0_1&moves=Ke7,Kb6&cursor=0) |
| 7-diagonal; Noncentral bishop not king-protected; interior king; knight unprotected by king; B moves | 3 | 3 | [1. Bd5](http://localhost:5173/mate/bishop-knight#fen=8/1K6/8/8/8/k2N4/B7/8_w_-_-_0_1&moves=Bd5,Ka4&cursor=0) |
| 7-diagonal; Noncentral bishop not king-protected; interior king; knight king-protected; K moves | 3 | 3 | [1. Kc3](http://localhost:5173/mate/bishop-knight#fen=8/5B2/2k5/8/8/3N4/2K5/8_w_-_-_0_1&moves=Kc3,Kd7&cursor=0) |
| 5-diagonal; Noncentral bishop not king-protected; interior king; knight unprotected by king; K moves | 3 | 3 | [1. Kc5](http://localhost:5173/mate/bishop-knight#fen=1k2B3/8/8/8/1K6/3N4/8/8_w_-_-_0_1&moves=Kc5,Kc8&cursor=0) |
| 5-diagonal; Noncentral bishop king-protected; edge king; knight king-protected; B moves | 2 | 2 | [1. Bc6](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/8/BN6/K7/8/8_w_-_-_0_1&moves=Bc6,Kc5&cursor=0) |
| 5-diagonal; Noncentral bishop king-protected; edge king; knight unprotected by king; N moves | 2 | 2 | [1. Na4](http://localhost:5173/mate/bishop-knight#fen=4BK2/2k5/1N6/8/8/8/8/8_w_-_-_0_1&moves=Na4,Kd6&cursor=0) |
| 7-diagonal; Noncentral bishop not king-protected; central king; knight king-protected; K moves | 2 | 2 | [1. Ke5](http://localhost:5173/mate/bishop-knight#fen=6B1/4k3/8/8/4K3/3N4/8/8_w_-_-_0_1&moves=Ke5,Kf8&cursor=0) |
| 5-diagonal; Noncentral bishop king-protected; edge king; knight king-protected; N moves | 2 | 2 | [1. Nc2](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/1B6/KN6/8/8/8_w_-_-_0_1&moves=Nc2,Kc5&cursor=0) |
| 5-diagonal; Noncentral bishop not king-protected; edge king; knight king-protected; K moves | 1 | 1 | [1. Ka5](http://localhost:5173/mate/bishop-knight#fen=1k2B3/8/8/8/KN6/8/8/8_w_-_-_0_1&moves=Ka5,Kc8&cursor=0) |
| 5-diagonal; Noncentral bishop not king-protected; interior king; knight king-protected; B moves | 1 | 1 | [1. Bc6](http://localhost:5173/mate/bishop-knight#fen=8/2K5/1N6/k7/B7/8/8/8_w_-_-_0_1&moves=Bc6,Kb4&cursor=0) |
| 5-diagonal; Noncentral bishop not king-protected; interior king; knight unprotected by king; B moves | 1 | 1 | [1. Bc6](http://localhost:5173/mate/bishop-knight#fen=8/2K5/8/k7/B7/2N5/8/8_w_-_-_0_1&moves=Bc6,Kb4&cursor=0) |
| 3-diagonal; Noncentral bishop king-protected; edge king; knight unprotected by king; N moves | 1 | 1 | [2. Ne3](http://localhost:5173/mate/bishop-knight#fen=k1B5/8/K7/3N4/8/8/8/8_w_-_-_0_1&moves=Bb7%2B,Kb8,Ne3,Kc7&cursor=0) |
| 3-diagonal; Noncentral bishop king-protected; interior king; knight king-protected; N moves | 1 | 1 | [2. Nd4](http://localhost:5173/mate/bishop-knight#fen=1N6/k7/B7/1K6/8/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nd4,Kb8&cursor=0) |

## Piece-position motifs directly on cycles

Every cyclic post-White board is counted once, even if it belongs to multiple components. These groups describe pieces and protection, not which piece shuttles.

| Motif | D4 positions | Physical positions | Components |
|---|---:|---:|---|
| Unsupported; Noncentral bishop not king-protected; edge king; knight unprotected by king | 102 | 816 | 1, 2, 3, 4, 10, 22, 23, 25, 27, 28, 29, 32, 35, 36, 37, 38, 40, 42, 43, 44, 45, 46, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 65, 66, 67, 68, 69, 70, 71, 73, 84, 89, 91, 93, 94, 96, 97, 98, 99, 102, 103, 105, 106, 108, 109, 110, 111, 114, 115, 116, 117, 118, 119, 120, 123, 124 |
| Unsupported; Noncentral bishop not king-protected; interior king; knight unprotected by king | 65 | 520 | 126, 133, 134, 135, 140, 142, 144, 145, 146, 147, 148, 162, 166, 167, 169, 170, 175, 176, 177, 179, 180, 190, 191, 192, 193, 194, 196, 197, 205, 238, 245, 246, 248, 250, 253, 254, 258, 265, 266, 268, 269, 271, 273, 279, 280 |
| Unsupported; Noncentral bishop not king-protected; edge king; knight on edge, unprotected by king | 55 | 440 | 4, 5, 6, 14, 15, 21, 24, 26, 30, 31, 32, 38, 45, 54, 57, 63, 64, 73, 74, 75, 76, 77, 81, 82, 83, 85, 86, 87, 88, 89, 94, 96, 100, 102, 104, 105, 107, 108, 111, 112, 113, 116, 119, 120, 121, 122, 123 |
| Unsupported; Noncentral bishop king-protected; interior king; knight unprotected by king | 47 | 376 | 125, 151, 152, 154, 158, 159, 160, 161, 162, 178, 180, 181, 183, 184, 187, 188, 199, 212, 213, 214, 218, 219, 221, 222, 224, 225, 227, 229, 232, 233, 258, 265, 266, 264, 279 |
| Unsupported; Noncentral bishop not king-protected; interior king; knight on edge, unprotected by king | 47 | 376 | 126, 130, 131, 132, 138, 141, 143, 149, 150, 163, 164, 165, 167, 168, 171, 179, 191, 195, 201, 205, 238, 239, 240, 245, 247, 250, 253, 255, 269, 270, 280, 285, 286, 288 |
| Unsupported; Noncentral bishop king-protected; interior king; knight on edge, unprotected by king | 39 | 312 | 152, 154, 158, 181, 182, 189, 206, 207, 208, 210, 211, 215, 220, 223, 226, 228, 230, 231, 234, 235, 236, 237 |
| Unsupported; Noncentral bishop not king-protected; central king; knight king-protected | 39 | 312 | 292, 348, 293, 349, 294, 295, 350, 296, 347, 297, 298, 299, 303, 319, 324, 330, 320, 325, 329, 333, 334, 321, 327, 322, 323, 332, 326, 328, 331 |
| Unsupported; Noncentral bishop not king-protected; central king; knight unprotected by king | 38 | 304 | 300, 301, 302, 303, 306, 307, 309, 308, 310, 311, 312, 313, 315, 314, 316, 317, 318, 335, 336, 343, 344, 345, 346 |
| Unsupported; Unprotected by king central bishop; knight on edge, off precage | 37 | 296 | 5, 6, 26, 14, 15, 21, 24, 30, 31, 74, 75, 76, 77, 81, 82, 83, 85, 86, 87, 88, 100, 130, 131, 132, 138, 141, 143, 149, 163, 164, 165 |
| Unsupported; Noncentral bishop king-protected; interior king; knight king-protected | 34 | 272 | 151, 153, 172, 155, 156, 157, 183, 212, 184, 185, 186, 216, 198, 202, 203, 244, 204, 207, 209, 217, 241, 242, 249, 251, 259, 260, 262, 263, 261, 272, 274, 290, 275, 276, 291, 277, 278, 283, 281, 289 |
| Unsupported; Noncentral bishop not king-protected; edge king; knight king-protected | 31 | 248 | 7, 8, 10, 9, 11, 33, 12, 18, 13, 19, 16, 17, 20, 34, 39, 41, 44, 52, 62, 72, 78, 79, 80, 92, 90, 95, 99, 101 |
| Unsupported; Noncentral bishop not king-protected; interior king; knight king-protected | 28 | 224 | 127, 128, 129, 136, 173, 174, 137, 139, 185, 198, 200, 203, 204, 244, 249, 251, 260, 252, 256, 267, 257, 259, 272, 274, 275, 290, 276, 277, 291, 289 |
| Unsupported; Unprotected by king central bishop; knight unprotected by king, off precage | 20 | 160 | 22, 23, 29, 27, 28, 47, 84, 133, 134, 135, 140, 144, 146, 148, 147, 160, 161, 187, 188, 243 |
| Unsupported; Unprotected by king central bishop; knight king-protected, off precage | 19 | 152 | 7, 39, 78, 79, 80, 95, 127, 128, 129, 136, 137, 173, 174, 139, 153, 155, 172, 156, 157, 202, 242, 241, 261, 262, 263 |
| Unsupported; Noncentral bishop king-protected; edge king; knight unprotected by king | 10 | 80 | 1, 42, 47, 48, 49, 50, 51 |
| Unsupported; King-protected central bishop; knight on precage | 7 | 56 | 282, 340, 341, 342 |
| Unsupported; King-protected central bishop; knight unprotected by king, off precage | 5 | 40 | 284, 287, 339 |
| Unsupported; Noncentral bishop not king-protected; central king; knight on edge, unprotected by king | 5 | 40 | 304, 305, 337, 338 |
| Unsupported; Noncentral bishop king-protected; edge king; knight king-protected | 4 | 32 | 41, 72, 90, 101 |
| Unsupported; King-protected central bishop; knight king-protected, off precage | 3 | 24 | 278, 283, 284 |
| Unsupported; Noncentral bishop king-protected; central king; knight on edge, unprotected by king | 2 | 16 | 305, 337 |
| Unsupported; Noncentral bishop king-protected; edge king; knight on edge, unprotected by king | 1 | 8 | 51 |
| Unsupported; King-protected central bishop; knight on edge, off precage | 1 | 8 | 285, 286 |
| Unsupported; Noncentral bishop king-protected; central king; knight king-protected | 1 | 8 | 294 |
| Unsupported; Noncentral bishop king-protected; central king; knight unprotected by king | 1 | 8 | 306 |

## Loop representatives

| Component | Supported cycle boards, D4 | Unsupported cycle boards, D4 | Reachable after support | Replay |
|---|---:|---:|---|---|
| 1 | 0 | 2 | no | [Ba2 Kd2 Bc4 Kc2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2B5/8/2k1N3/K7_w_-_-_0_1&moves=Ba2,Kd2,Bc4,Kc2&cursor=0) |
| 2 | 0 | 2 | no | [Ne3 Kd3 Nc2 Kc3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/B7/2k5/2N5/K7_w_-_-_0_1&moves=Ne3,Kd3,Nc2,Kc3&cursor=0) |
| 3 | 0 | 2 | no | [Nc2 Kc3 Ne3 Kd2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/B7/4N3/3k4/K7_w_-_-_0_1&moves=Nc2,Kc3,Ne3,Kd2&cursor=0) |
| 4 | 0 | 2 | no | [Nb7 Kc6 Na5+ Kb5](http://localhost:5173/mate/bishop-knight#fen=2B4K/8/8/Nk6/8/8/8/8_w_-_-_0_1&moves=Nb7,Kc6,Na5%2B,Kb5&cursor=0) |
| 5 | 0 | 4 | no | [Bh1 Kc3 Be4 Kd4 Ba8 Kc3 Bd5 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/3k4/N7/8/K7_w_-_-_0_1&moves=Bh1,Kc3,Be4,Kd4,Ba8,Kc3,Bd5,Kd4&cursor=0) |
| 6 | 0 | 3 | no | [Bd5 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/N7/8/2k5/8/K7_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Kc3&cursor=0) |
| 7 | 0 | 2 | no | [Bd5 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/2k5/1N6/K7_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Kc3&cursor=0) |
| 8 | 0 | 2 | no | [Bh1 Kd4 Ba8 Kc5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/2k5/8/8/1N6/K7_w_-_-_0_1&moves=Bh1,Kd4,Ba8,Kc5&cursor=0) |
| 9 | 0 | 2 | no | [Bh1 Kf4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/4k3/8/8/1N6/K7_w_-_-_0_1&moves=Bh1,Kf4,Ba8,Ke5&cursor=0) |
| 10 | 0 | 2 | no | [Nc4+ Kd4 Nb2 Ke3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/4k3/1N6/K7_w_-_-_0_1&moves=Nc4%2B,Kd4,Nb2,Ke3&cursor=0) |
| 11 | 0 | 2 | no | [Bb7 Ke5 Ba8 Kf4](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/5k2/8/1N6/K7_w_-_-_0_1&moves=Bb7,Ke5,Ba8,Kf4&cursor=0) |
| 12 | 0 | 1 | no | [Bh1 Kf5 Ba8 Ke6](http://localhost:5173/mate/bishop-knight#fen=B7/8/4k3/8/8/8/1N6/K7_w_-_-_0_1&moves=Bh1,Kf5,Ba8,Ke6&cursor=0) |
| 13 | 0 | 2 | no | [Bh1 Kg5 Ba8 Kf6](http://localhost:5173/mate/bishop-knight#fen=B7/8/5k2/8/8/8/1N6/K7_w_-_-_0_1&moves=Bh1,Kg5,Ba8,Kf6&cursor=0) |
| 14 | 0 | 3 | no | [Bd5 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/8/N7/8/8/2k5/8/K7_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Kc3&cursor=0) |
| 15 | 0 | 3 | no | [Bd5 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/N7/8/8/8/2k5/8/K7_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Kc3&cursor=0) |
| 16 | 0 | 1 | no | [Bh1 Kg6 Ba8 Kf7](http://localhost:5173/mate/bishop-knight#fen=B7/5k2/8/8/8/8/1N6/K7_w_-_-_0_1&moves=Bh1,Kg6,Ba8,Kf7&cursor=0) |
| 17 | 0 | 2 | no | [Bh1 Kh6 Ba8 Kg7](http://localhost:5173/mate/bishop-knight#fen=B7/6k1/8/8/8/8/1N6/K7_w_-_-_0_1&moves=Bh1,Kh6,Ba8,Kg7&cursor=0) |
| 18 | 0 | 2 | no | [Bb7 Kf5 Ba8 Kg4](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/6k1/8/1N6/K7_w_-_-_0_1&moves=Bb7,Kf5,Ba8,Kg4&cursor=0) |
| 19 | 0 | 2 | no | [Bb7 Kf6 Ba8 Kg5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/6k1/8/8/1N6/K7_w_-_-_0_1&moves=Bb7,Kf6,Ba8,Kg5&cursor=0) |
| 20 | 0 | 1 | no | [Bh1 Kh7 Ba8 Kg8](http://localhost:5173/mate/bishop-knight#fen=B5k1/8/8/8/8/8/1N6/K7_w_-_-_0_1&moves=Bh1,Kh7,Ba8,Kg8&cursor=0) |
| 21 | 0 | 3 | no | [Bd5 Ke5 Ba8 Kf6](http://localhost:5173/mate/bishop-knight#fen=B6K/N7/5k2/8/8/8/8/8_w_-_-_0_1&moves=Bd5,Ke5,Ba8,Kf6&cursor=0) |
| 22 | 0 | 2 | no | [Be4 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/8/1N6/8/8/2k5/8/K7_w_-_-_0_1&moves=Be4,Kd4,Ba8,Kc3&cursor=0) |
| 23 | 0 | 2 | no | [Be4 Ke5 Ba8 Kf6](http://localhost:5173/mate/bishop-knight#fen=B6K/8/1N3k2/8/8/8/8/8_w_-_-_0_1&moves=Be4,Ke5,Ba8,Kf6&cursor=0) |
| 24 | 0 | 3 | no | [Bd5 Ke5 Ba8 Kf6](http://localhost:5173/mate/bishop-knight#fen=B6K/8/N4k2/8/8/8/8/8_w_-_-_0_1&moves=Bd5,Ke5,Ba8,Kf6&cursor=0) |
| 25 | 0 | 2 | no | [Bb7 Kb3 Ba8 Kc2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/3N4/8/8/2k5/K7_w_-_-_0_1&moves=Bb7,Kb3,Ba8,Kc2&cursor=0) |
| 26 | 0 | 3 | no | [Bd5 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/2k5/8/K3N3_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Kc3&cursor=0) |
| 27 | 0 | 2 | no | [Bd5 Kd3 Ba8 Kc2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/4N3/8/2k5/K7_w_-_-_0_1&moves=Bd5,Kd3,Ba8,Kc2&cursor=0) |
| 28 | 0 | 3 | no | [Bd5 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/2k5/6N1/K7_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Kc3&cursor=0) |
| 29 | 0 | 2 | no | [Bd5 Ke5 Ba8 Kf6](http://localhost:5173/mate/bishop-knight#fen=B6K/8/5k2/8/8/8/5N2/8_w_-_-_0_1&moves=Bd5,Ke5,Ba8,Kf6&cursor=0) |
| 30 | 0 | 3 | no | [Bd5 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/2k5/8/K6N_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Kc3&cursor=0) |
| 31 | 0 | 2 | no | [Bd5 Ke5 Ba8 Kf6](http://localhost:5173/mate/bishop-knight#fen=B6K/8/5k2/8/8/8/8/N7_w_-_-_0_1&moves=Bd5,Ke5,Ba8,Kf6&cursor=0) |
| 32 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B6/8/K7_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 33 | 0 | 2 | no | [Ba8 Kf4 Bb7 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/1B6/8/8/8/6k1/1N6/K7_w_-_-_0_1&moves=Ba8,Kf4,Bb7,Kg3&cursor=0) |
| 34 | 0 | 2 | no | [Ba8 Kf5 Bb7 Kg4](http://localhost:5173/mate/bishop-knight#fen=8/1B6/8/8/6k1/8/1N6/K7_w_-_-_0_1&moves=Ba8,Kf5,Bb7,Kg4&cursor=0) |
| 35 | 0 | 2 | no | [Ba8 Kb3 Bb7 Kc2](http://localhost:5173/mate/bishop-knight#fen=8/1B6/8/3N4/8/8/2k5/K7_w_-_-_0_1&moves=Ba8,Kb3,Bb7,Kc2&cursor=0) |
| 36 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=K7/8/2B5/8/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 37 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=7K/8/2B5/8/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 38 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B6/8/7K_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 39 | 0 | 2 | no | [Bh1 Kc3 Bd5 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/1k6/8/1N6/K7_w_-_-_0_1&moves=Bh1,Kc3,Bd5,Kb4&cursor=0) |
| 40 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/8/8/3k4/2N5/7K_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 41 | 0 | 2 | no | [Ba2 Kd4 Bg8 Kc3](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/8/8/2k5/1N6/K7_w_-_-_0_1&moves=Ba2,Kd4,Bg8,Kc3&cursor=0) |
| 42 | 0 | 2 | no | [Be6 Kc6 Bc8 Kb5](http://localhost:5173/mate/bishop-knight#fen=1KB5/8/8/1k6/2N5/8/8/8_w_-_-_0_1&moves=Be6,Kc6,Bc8,Kb5&cursor=0) |
| 43 | 0 | 2 | no | [Nb3 Kc4 Nd2+ Kd3](http://localhost:5173/mate/bishop-knight#fen=8/K7/8/8/B7/3k4/3N4/8_w_-_-_0_1&moves=Nb3,Kc4,Nd2%2B,Kd3&cursor=0) |
| 44 | 0 | 2 | no | [Nc7 Kc6 Na8 Kc5](http://localhost:5173/mate/bishop-knight#fen=N7/K7/8/2k5/8/8/B7/8_w_-_-_0_1&moves=Nc7,Kc6,Na8,Kc5&cursor=0) |
| 45 | 0 | 2 | no | [Na3 Kc5 Nc4 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/K7/2k5/8/2N5/8/B7/8_w_-_-_0_1&moves=Na3,Kc5,Nc4,Kc6&cursor=0) |
| 46 | 0 | 2 | no | [Bg8 Kd6 Bc4 Kc5](http://localhost:5173/mate/bishop-knight#fen=1K6/8/8/2k5/2B5/8/4N3/8_w_-_-_0_1&moves=Bg8,Kd6,Bc4,Kc5&cursor=0) |
| 47 | 0 | 2 | no | [Bb7 Kb4 Bd5 Kb5](http://localhost:5173/mate/bishop-knight#fen=8/K7/8/1k1B4/8/1N6/8/8_w_-_-_0_1&moves=Bb7,Kb4,Bd5,Kb5&cursor=0) |
| 48 | 0 | 2 | no | [Ne7 Kc5 Nd5 Kb5](http://localhost:5173/mate/bishop-knight#fen=8/KB6/8/1k1N4/8/8/8/8_w_-_-_0_1&moves=Ne7,Kc5,Nd5,Kb5&cursor=0) |
| 49 | 0 | 2 | no | [Ka7 Kc5 Kb8 Kd6](http://localhost:5173/mate/bishop-knight#fen=1K6/1B6/3k4/8/8/8/1N6/8_w_-_-_0_1&moves=Ka7,Kc5,Kb8,Kd6&cursor=0) |
| 50 | 0 | 2 | no | [Ka7 Kc5 Kb8 Kd6](http://localhost:5173/mate/bishop-knight#fen=1K6/1B6/3k4/8/8/8/2N5/8_w_-_-_0_1&moves=Ka7,Kc5,Kb8,Kd6&cursor=0) |
| 51 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B6/K7/8_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 52 | 0 | 2 | no | [Ba2 Kc5 Bg8 Kd6](http://localhost:5173/mate/bishop-knight#fen=6B1/8/3k4/8/8/8/5N2/6K1_w_-_-_0_1&moves=Ba2,Kc5,Bg8,Kd6&cursor=0) |
| 53 | 0 | 2 | no | [Bc4 Ke4 Ba2 Kf3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3N4/8/5k2/B7/6K1_w_-_-_0_1&moves=Bc4,Ke4,Ba2,Kf3&cursor=0) |
| 54 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B6/8/1K6_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 55 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=1K6/8/2B5/8/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 56 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=6K1/8/2B5/8/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 57 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B6/8/6K1_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 58 | 0 | 2 | no | [Nb3 Kc4 Nd2+ Kd3](http://localhost:5173/mate/bishop-knight#fen=1K6/8/8/8/B7/3k4/3N4/8_w_-_-_0_1&moves=Nb3,Kc4,Nd2%2B,Kd3&cursor=0) |
| 59 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/7K/2B5/8/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 60 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/8/8/3k4/2N5/6K1_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 61 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/8/8/3k4/2N4K/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 62 | 0 | 2 | no | [Nc7 Kc6 Na8 Kc5](http://localhost:5173/mate/bishop-knight#fen=N5B1/K7/8/2k5/8/8/8/8_w_-_-_0_1&moves=Nc7,Kc6,Na8,Kc5&cursor=0) |
| 63 | 0 | 2 | no | [Nc4 Kc6 Na3 Kc5](http://localhost:5173/mate/bishop-knight#fen=6B1/K7/8/2k5/8/N7/8/8_w_-_-_0_1&moves=Nc4,Kc6,Na3,Kc5&cursor=0) |
| 64 | 0 | 2 | no | [Kb8 Kd6 Ka7 Kc5](http://localhost:5173/mate/bishop-knight#fen=6B1/K7/8/2k5/8/8/N7/8_w_-_-_0_1&moves=Kb8,Kd6,Ka7,Kc5&cursor=0) |
| 65 | 0 | 2 | no | [Bc4 Kd4 Bg8 Kc5](http://localhost:5173/mate/bishop-knight#fen=6B1/K7/8/2k5/8/8/3N4/8_w_-_-_0_1&moves=Bc4,Kd4,Bg8,Kc5&cursor=0) |
| 66 | 0 | 2 | no | [Ne7 Kc5 Nd5 Kb5](http://localhost:5173/mate/bishop-knight#fen=6B1/K7/8/1k1N4/8/8/8/8_w_-_-_0_1&moves=Ne7,Kc5,Nd5,Kb5&cursor=0) |
| 67 | 0 | 2 | no | [Kh2 Kg4 Kg1 Kf3](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/3N4/8/5k2/8/6K1_w_-_-_0_1&moves=Kh2,Kg4,Kg1,Kf3&cursor=0) |
| 68 | 0 | 2 | no | [Kg1 Kf3 Kh2 Kg4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N3k1/8/B6K/8_w_-_-_0_1&moves=Kg1,Kf3,Kh2,Kg4&cursor=0) |
| 69 | 0 | 2 | no | [Kg1 Ke2 Kh2 Kf3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2N5/5k2/B6K/8_w_-_-_0_1&moves=Kg1,Ke2,Kh2,Kf3&cursor=0) |
| 70 | 0 | 2 | no | [Kg1 Kf3 Kh2 Kg4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/6k1/1N6/B6K/8_w_-_-_0_1&moves=Kg1,Kf3,Kh2,Kg4&cursor=0) |
| 71 | 0 | 2 | no | [Kg1 Ke3 Kh2 Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5k2/1N6/B6K/8_w_-_-_0_1&moves=Kg1,Ke3,Kh2,Kf4&cursor=0) |
| 72 | 0 | 2 | yes | [Bc6 Kc5 Ba4 Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/8/BN6/K7/8/8_w_-_-_0_1&moves=Bc6,Kc5,Ba4,Kb6&cursor=0) |
| 73 | 0 | 2 | no | [Nb7 Kc6 Na5+ Kb5](http://localhost:5173/mate/bishop-knight#fen=2B2K2/8/8/Nk6/8/8/8/8_w_-_-_0_1&moves=Nb7,Kc6,Na5%2B,Kb5&cursor=0) |
| 74 | 0 | 2 | no | [Ba8 Kc3 Bd5 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/3k4/K7/8/N7_w_-_-_0_1&moves=Ba8,Kc3,Bd5,Kd4&cursor=0) |
| 75 | 0 | 2 | no | [Bd5 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/N7/8/K1k5/8/8_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Kc3&cursor=0) |
| 76 | 0 | 2 | no | [Bd5 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/8/N7/8/8/K1k5/8/8_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Kc3&cursor=0) |
| 77 | 0 | 2 | no | [Bd5 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/N7/8/8/8/K1k5/8/8_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Kc3&cursor=0) |
| 78 | 0 | 2 | no | [Bd5 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/K1k5/1N6/8_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Kc3&cursor=0) |
| 79 | 0 | 2 | no | [Bd5 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/1N6/K1k5/8/8_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Kc3&cursor=0) |
| 80 | 0 | 3 | no | [Ba8 Kc5 Bc6 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/8/1N1k4/K7/8/8_w_-_-_0_1&moves=Ba8,Kc5,Bc6,Kd4&cursor=0) |
| 81 | 0 | 2 | no | [Bd5 Ke5 Ba8 Kf6](http://localhost:5173/mate/bishop-knight#fen=B4K2/N7/5k2/8/8/8/8/8_w_-_-_0_1&moves=Bd5,Ke5,Ba8,Kf6&cursor=0) |
| 82 | 0 | 2 | no | [Ba8 Kc3 Bd5 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/3k4/K7/8/2N5_w_-_-_0_1&moves=Ba8,Kc3,Bd5,Kd4&cursor=0) |
| 83 | 0 | 2 | no | [Bd5 Ke5 Ba8 Kf6](http://localhost:5173/mate/bishop-knight#fen=B4K2/8/N4k2/8/8/8/8/8_w_-_-_0_1&moves=Bd5,Ke5,Ba8,Kf6&cursor=0) |
| 84 | 0 | 2 | no | [Bd5 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/K1k5/6N1/8_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Kc3&cursor=0) |
| 85 | 0 | 2 | no | [Bd5 Ke5 Ba8 Kf6](http://localhost:5173/mate/bishop-knight#fen=B4K2/8/5k2/8/8/8/N7/8_w_-_-_0_1&moves=Bd5,Ke5,Ba8,Kf6&cursor=0) |
| 86 | 0 | 2 | no | [Bd5 Kd4 Ba8 Kc3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/K1k5/8/7N_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Kc3&cursor=0) |
| 87 | 0 | 2 | no | [Bd5 Ke5 Ba8 Kf6](http://localhost:5173/mate/bishop-knight#fen=B4K2/8/5k2/8/8/8/8/1N6_w_-_-_0_1&moves=Bd5,Ke5,Ba8,Kf6&cursor=0) |
| 88 | 0 | 2 | no | [Bd5 Ke5 Ba8 Kf6](http://localhost:5173/mate/bishop-knight#fen=B4K2/8/5k2/8/8/8/8/N7_w_-_-_0_1&moves=Bd5,Ke5,Ba8,Kf6&cursor=0) |
| 89 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B6/8/2K5_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 90 | 0 | 2 | no | [Bb7 Kc7 Bc6 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/N7/K1B5/8/8/8/8/8_w_-_-_0_1&moves=Bb7,Kc7,Bc6,Kb8&cursor=0) |
| 91 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=2K5/8/2B5/8/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 92 | 0 | 2 | no | [Bh1 Kc5 Bc6 Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1kB5/8/1N6/K7/8/8_w_-_-_0_1&moves=Bh1,Kc5,Bc6,Kb6&cursor=0) |
| 93 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=5K2/8/2B5/8/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 94 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B6/8/5K2_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 95 | 0 | 2 | no | [Bh1 Kc5 Bd5 Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/3B4/1N6/K7/8/8_w_-_-_0_1&moves=Bh1,Kc5,Bd5,Kb6&cursor=0) |
| 96 | 0 | 2 | no | [Nb7 Kc6 Na5+ Kb5](http://localhost:5173/mate/bishop-knight#fen=2B5/8/7K/Nk6/8/8/8/8_w_-_-_0_1&moves=Nb7,Kc6,Na5%2B,Kb5&cursor=0) |
| 97 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B4K/8/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 98 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/8/8/3k3K/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 99 | 0 | 2 | no | [Nc4+ Kd4 Nb2 Ke3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/4k3/1N6/2K5_w_-_-_0_1&moves=Nc4%2B,Kd4,Nb2,Ke3&cursor=0) |
| 100 | 0 | 2 | no | [Be4 Ke5 Ba8 Kd6](http://localhost:5173/mate/bishop-knight#fen=B2K4/8/3k4/8/8/8/8/1N6_w_-_-_0_1&moves=Be4,Ke5,Ba8,Kd6&cursor=0) |
| 101 | 0 | 2 | no | [Bc6 Kc3 Ba4 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/K7/BN6/8/1k6/8_w_-_-_0_1&moves=Bc6,Kc3,Ba4,Kb2&cursor=0) |
| 102 | 0 | 2 | no | [Nd8+ Kd7 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/K7/8/8/B7/8_w_-_-_0_1&moves=Nd8%2B,Kd7,Nb7,Kc6&cursor=0) |
| 103 | 0 | 2 | no | [Bg8 Kd6 Bc4 Kc5](http://localhost:5173/mate/bishop-knight#fen=3K4/8/8/2k5/2B5/8/4N3/8_w_-_-_0_1&moves=Bg8,Kd6,Bc4,Kc5&cursor=0) |
| 104 | 0 | 2 | no | [Bc4 Kc5 Bg8 Kd6](http://localhost:5173/mate/bishop-knight#fen=3K2B1/8/3k4/8/8/8/8/5N2_w_-_-_0_1&moves=Bc4,Kc5,Bg8,Kd6&cursor=0) |
| 105 | 0 | 2 | no | [Nd8+ Kd7 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/K7/8/1B6/8/8_w_-_-_0_1&moves=Nd8%2B,Kd7,Nb7,Kc6&cursor=0) |
| 106 | 0 | 2 | no | [Be6 Ke5 Bg8 Kf4](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/8/5k1K/1N6/8/8_w_-_-_0_1&moves=Be6,Ke5,Bg8,Kf4&cursor=0) |
| 107 | 0 | 2 | no | [Be6 Ke5 Bg8 Kf4](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/8/5k1K/8/N7/8_w_-_-_0_1&moves=Be6,Ke5,Bg8,Kf4&cursor=0) |
| 108 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B6/8/3K4_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 109 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=3K4/8/2B5/8/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 110 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=4K3/8/2B5/8/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 111 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B6/8/4K3_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 112 | 0 | 2 | no | [Bc4 Kd4 Bg8 Ke3](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/8/8/4k3/8/4K1N1_w_-_-_0_1&moves=Bc4,Kd4,Bg8,Ke3&cursor=0) |
| 113 | 0 | 2 | no | [Be6 Ke5 Ba2 Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5k1K/8/B7/6N1_w_-_-_0_1&moves=Be6,Ke5,Ba2,Kf4&cursor=0) |
| 114 | 0 | 2 | no | [Be6 Ke5 Ba2 Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/5k1K/8/B4N2/8_w_-_-_0_1&moves=Be6,Ke5,Ba2,Kf4&cursor=0) |
| 115 | 0 | 2 | no | [Nb3 Kc4 Nd2+ Kd3](http://localhost:5173/mate/bishop-knight#fen=3K4/8/8/8/B7/3k4/3N4/8_w_-_-_0_1&moves=Nb3,Kc4,Nd2%2B,Kd3&cursor=0) |
| 116 | 0 | 2 | no | [Nd8+ Kd7 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N3B2/2k5/K7/8/8/8/8_w_-_-_0_1&moves=Nd8%2B,Kd7,Nb7,Kc6&cursor=0) |
| 117 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/7K/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 118 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/8/7K/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 119 | 0 | 2 | no | [Nc7 Kc6 Na8 Kc5](http://localhost:5173/mate/bishop-knight#fen=N5B1/8/8/K1k5/8/8/8/8_w_-_-_0_1&moves=Nc7,Kc6,Na8,Kc5&cursor=0) |
| 120 | 0 | 2 | no | [Nd8+ Kd7 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=6B1/1N6/2k5/K7/8/8/8/8_w_-_-_0_1&moves=Nd8%2B,Kd7,Nb7,Kc6&cursor=0) |
| 121 | 0 | 2 | no | [Bc4 Kd4 Bg8 Ke3](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/8/8/4k3/8/4K2N_w_-_-_0_1&moves=Bc4,Kd4,Bg8,Ke3&cursor=0) |
| 122 | 0 | 2 | no | [Bc4 Kd4 Bg8 Ke3](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/8/8/4k3/8/2N1K3_w_-_-_0_1&moves=Bc4,Kd4,Bg8,Ke3&cursor=0) |
| 123 | 0 | 2 | no | [Nc3 Kd3 Nb1 Ke3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/4k3/8/1N2K3_w_-_-_0_1&moves=Nc3,Kd3,Nb1,Ke3&cursor=0) |
| 124 | 0 | 2 | no | [Nc4+ Kd4 Nb2 Ke3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/4k3/1N6/4K3_w_-_-_0_1&moves=Nc4%2B,Kd4,Nb2,Ke3&cursor=0) |
| 125 | 0 | 2 | no | [Nd2+ Kd3 Nb3 Kc4](http://localhost:5173/mate/bishop-knight#fen=B7/1K6/8/8/2k5/1N6/8/8_w_-_-_0_1&moves=Nd2%2B,Kd3,Nb3,Kc4&cursor=0) |
| 126 | 0 | 2 | no | [Nb7 Kc6 Na5+ Kb5](http://localhost:5173/mate/bishop-knight#fen=2B5/6K1/8/Nk6/8/8/8/8_w_-_-_0_1&moves=Nb7,Kc6,Na5%2B,Kb5&cursor=0) |
| 127 | 0 | 2 | no | [Be4 Ke3 Ba8 Kd2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/8/1K1k4/N7_w_-_-_0_1&moves=Be4,Ke3,Ba8,Kd2&cursor=0) |
| 128 | 0 | 2 | no | [Be4 Ke3 Ba8 Kd2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/8/NK1k4/8_w_-_-_0_1&moves=Be4,Ke3,Ba8,Kd2&cursor=0) |
| 129 | 0 | 2 | no | [Be4 Ke3 Ba8 Kd2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/N7/1K1k4/8_w_-_-_0_1&moves=Be4,Ke3,Ba8,Kd2&cursor=0) |
| 130 | 0 | 2 | no | [Be4 Ke3 Ba8 Kd2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/N7/8/8/1K1k4/8_w_-_-_0_1&moves=Be4,Ke3,Ba8,Kd2&cursor=0) |
| 131 | 0 | 2 | no | [Be4 Ke3 Ba8 Kd2](http://localhost:5173/mate/bishop-knight#fen=B7/8/N7/8/8/8/1K1k4/8_w_-_-_0_1&moves=Be4,Ke3,Ba8,Kd2&cursor=0) |
| 132 | 0 | 2 | no | [Be4 Ke3 Ba8 Kd2](http://localhost:5173/mate/bishop-knight#fen=B7/N7/8/8/8/8/1K1k4/8_w_-_-_0_1&moves=Be4,Ke3,Ba8,Kd2&cursor=0) |
| 133 | 0 | 2 | no | [Be4 Ke3 Ba8 Kd2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/1N6/8/1K1k4/8_w_-_-_0_1&moves=Be4,Ke3,Ba8,Kd2&cursor=0) |
| 134 | 0 | 2 | no | [Be4 Ke3 Ba8 Kd2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/1N6/8/8/1K1k4/8_w_-_-_0_1&moves=Be4,Ke3,Ba8,Kd2&cursor=0) |
| 135 | 0 | 2 | no | [Be4 Ke3 Ba8 Kd2](http://localhost:5173/mate/bishop-knight#fen=B7/8/1N6/8/8/8/1K1k4/8_w_-_-_0_1&moves=Be4,Ke3,Ba8,Kd2&cursor=0) |
| 136 | 0 | 2 | no | [Be4 Ke3 Ba8 Kd2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/2N5/1K1k4/8_w_-_-_0_1&moves=Be4,Ke3,Ba8,Kd2&cursor=0) |
| 137 | 0 | 2 | no | [Bd5 Ke5 Ba8 Kd4](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/3k4/2N5/1K6/8_w_-_-_0_1&moves=Bd5,Ke5,Ba8,Kd4&cursor=0) |
| 138 | 0 | 2 | no | [Be4 Kf4 Ba8 Kg5](http://localhost:5173/mate/bishop-knight#fen=B7/N5K1/8/6k1/8/8/8/8_w_-_-_0_1&moves=Be4,Kf4,Ba8,Kg5&cursor=0) |
| 139 | 0 | 2 | no | [Be4 Ke3 Ba8 Kd2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/8/1K1k4/2N5_w_-_-_0_1&moves=Be4,Ke3,Ba8,Kd2&cursor=0) |
| 140 | 0 | 2 | no | [Be4 Kf4 Ba8 Kg5](http://localhost:5173/mate/bishop-knight#fen=B7/6K1/1N6/6k1/8/8/8/8_w_-_-_0_1&moves=Be4,Kf4,Ba8,Kg5&cursor=0) |
| 141 | 0 | 2 | no | [Be4 Kf4 Ba8 Kg5](http://localhost:5173/mate/bishop-knight#fen=B7/6K1/N7/6k1/8/8/8/8_w_-_-_0_1&moves=Be4,Kf4,Ba8,Kg5&cursor=0) |
| 142 | 0 | 2 | no | [Nb6 Kd4 Nd5 Kd3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/3N4/8/3k4/1K6/8_w_-_-_0_1&moves=Nb6,Kd4,Nd5,Kd3&cursor=0) |
| 143 | 0 | 2 | no | [Be4 Kf4 Ba8 Kg5](http://localhost:5173/mate/bishop-knight#fen=B7/6K1/8/N5k1/8/8/8/8_w_-_-_0_1&moves=Be4,Kf4,Ba8,Kg5&cursor=0) |
| 144 | 0 | 2 | no | [Be4 Kf4 Ba8 Kg5](http://localhost:5173/mate/bishop-knight#fen=B7/6K1/8/1N4k1/8/8/8/8_w_-_-_0_1&moves=Be4,Kf4,Ba8,Kg5&cursor=0) |
| 145 | 0 | 2 | no | [Ne4 Kc4 Nf2 Kd4](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/3k4/8/1K3N2/8_w_-_-_0_1&moves=Ne4,Kc4,Nf2,Kd4&cursor=0) |
| 146 | 0 | 2 | no | [Bd5 Kd4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/6K1/8/4k3/1N6/8/8/8_w_-_-_0_1&moves=Bd5,Kd4,Ba8,Ke5&cursor=0) |
| 147 | 0 | 2 | no | [Be4 Kf4 Ba8 Kg5](http://localhost:5173/mate/bishop-knight#fen=B7/6K1/8/6k1/8/8/5N2/8_w_-_-_0_1&moves=Be4,Kf4,Ba8,Kg5&cursor=0) |
| 148 | 0 | 2 | no | [Be4 Kd4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/6K1/8/4k3/8/8/3N4/8_w_-_-_0_1&moves=Be4,Kd4,Ba8,Ke5&cursor=0) |
| 149 | 0 | 2 | no | [Be4 Ke3 Ba8 Kd2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/8/1K1k4/7N_w_-_-_0_1&moves=Be4,Ke3,Ba8,Kd2&cursor=0) |
| 150 | 0 | 2 | no | [Bh1 Ke5 Bc6 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/6K1/2Bk4/8/N7/8/8/8_w_-_-_0_1&moves=Bh1,Ke5,Bc6,Kd6&cursor=0) |
| 151 | 0 | 2 | no | [Nd2 Kd3 Nb1 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3k4/1B6/1K6/1N6_w_-_-_0_1&moves=Nd2,Kd3,Nb1,Kd4&cursor=0) |
| 152 | 0 | 2 | no | [Na7 Kd4 Nb5+ Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1N6/8/1B1k4/1K6/8_w_-_-_0_1&moves=Na7,Kd4,Nb5%2B,Kd3&cursor=0) |
| 153 | 0 | 2 | no | [Bd5 Kb4 Bb3 Ka5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/k7/8/1BN5/1K6/8_w_-_-_0_1&moves=Bd5,Kb4,Bb3,Ka5&cursor=0) |
| 154 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B6/1K6/8_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 155 | 0 | 2 | no | [Bd5 Kd4 Bb3 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2k5/8/1BN5/1K6/8_w_-_-_0_1&moves=Bd5,Kd4,Bb3,Kc5&cursor=0) |
| 156 | 0 | 2 | no | [Bd5 Kd4 Bb3 Ke3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/1BN1k3/1K6/8_w_-_-_0_1&moves=Bd5,Kd4,Bb3,Ke3&cursor=0) |
| 157 | 0 | 2 | no | [Bb3 Ke5 Bd5 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/3k4/2N5/1K6/8_w_-_-_0_1&moves=Bb3,Ke5,Bd5,Kd4&cursor=0) |
| 158 | 0 | 2 | no | [Nf2 Ke3 Nd1+ Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3k4/1B6/1K6/3N4_w_-_-_0_1&moves=Nf2,Ke3,Nd1%2B,Kd4&cursor=0) |
| 159 | 0 | 2 | no | [Nb6 Kd4 Nd5 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3N4/8/1B1k4/1K6/8_w_-_-_0_1&moves=Nb6,Kd4,Nd5,Kd3&cursor=0) |
| 160 | 0 | 2 | no | [Bd5 Kd3 Bb3 Ke2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/1B3N2/1K2k3/8_w_-_-_0_1&moves=Bd5,Kd3,Bb3,Ke2&cursor=0) |
| 161 | 0 | 2 | no | [Bb3 Ke3 Bd5 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/8/3k1N2/1K6/8_w_-_-_0_1&moves=Bb3,Ke3,Bd5,Kd3&cursor=0) |
| 162 | 0 | 2 | no | [Bd1 Kd3 Bb3 Ke4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/4k3/1B3N2/1K6/8_w_-_-_0_1&moves=Bd1,Kd3,Bb3,Ke4&cursor=0) |
| 163 | 0 | 2 | no | [Be4 Ke3 Bc6 Kd2](http://localhost:5173/mate/bishop-knight#fen=N7/8/2B5/8/8/8/1K1k4/8_w_-_-_0_1&moves=Be4,Ke3,Bc6,Kd2&cursor=0) |
| 164 | 0 | 2 | no | [Be4 Ke3 Bc6 Kd2](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/8/N7/8/1K1k4/8_w_-_-_0_1&moves=Be4,Ke3,Bc6,Kd2&cursor=0) |
| 165 | 0 | 2 | no | [Be4 Kf4 Bc6 Kg5](http://localhost:5173/mate/bishop-knight#fen=8/6K1/2B5/6k1/N7/8/8/8_w_-_-_0_1&moves=Be4,Kf4,Bc6,Kg5&cursor=0) |
| 166 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/6K1/2B5/8/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 167 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B6/6K1/8_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 168 | 0 | 3 | no | [Be6 Ke5 Bc8 Kd4](http://localhost:5173/mate/bishop-knight#fen=2B5/8/N7/8/3k4/8/1K6/8_w_-_-_0_1&moves=Be6,Ke5,Bc8,Kd4&cursor=0) |
| 169 | 0 | 2 | no | [Bc4 Ke4 Ba6 Kf5](http://localhost:5173/mate/bishop-knight#fen=8/6K1/B7/5k2/8/3N4/8/8_w_-_-_0_1&moves=Bc4,Ke4,Ba6,Kf5&cursor=0) |
| 170 | 0 | 2 | no | [Bd3 Kf4 Ba6 Kg5](http://localhost:5173/mate/bishop-knight#fen=8/6K1/B7/6k1/8/8/5N2/8_w_-_-_0_1&moves=Bd3,Kf4,Ba6,Kg5&cursor=0) |
| 171 | 0 | 3 | no | [Bc4 Kd4 Ba6 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/6K1/B7/4k3/8/8/8/5N2_w_-_-_0_1&moves=Bc4,Kd4,Ba6,Ke5&cursor=0) |
| 172 | 0 | 2 | no | [Bb3 Kc5 Bd5 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/1k6/2N5/1K6/8_w_-_-_0_1&moves=Bb3,Kc5,Bd5,Kb4&cursor=0) |
| 173 | 0 | 2 | no | [Bh1 Kd4 Bd5 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2kB4/8/2N5/1K6/8_w_-_-_0_1&moves=Bh1,Kd4,Bd5,Kc5&cursor=0) |
| 174 | 0 | 2 | no | [Ba8 Kd4 Bd5 Ke3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/8/2N1k3/1K6/8_w_-_-_0_1&moves=Ba8,Kd4,Bd5,Ke3&cursor=0) |
| 175 | 0 | 2 | no | [Be8 Ke4 Bb5 Kf5](http://localhost:5173/mate/bishop-knight#fen=8/6K1/8/1B3k2/8/3N4/8/8_w_-_-_0_1&moves=Be8,Ke4,Bb5,Kf5&cursor=0) |
| 176 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/8/8/3k4/2N3K1/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 177 | 0 | 2 | no | [Bb1 Kd5 Ba2 Ke6](http://localhost:5173/mate/bishop-knight#fen=8/6K1/4k3/8/2N5/8/B7/8_w_-_-_0_1&moves=Bb1,Kd5,Ba2,Ke6&cursor=0) |
| 178 | 0 | 2 | no | [Ng4+ Kf4 Nf2 Ke3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/1K2k3/B4N2/8_w_-_-_0_1&moves=Ng4%2B,Kf4,Nf2,Ke3&cursor=0) |
| 179 | 0 | 2 | no | [Nc4+ Kd5 Na3+ Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/1K1k4/8/8/N7/B7/8_w_-_-_0_1&moves=Nc4%2B,Kd5,Na3%2B,Kd6&cursor=0) |
| 180 | 0 | 2 | no | [Bf5 Kd5 Bd7 Kc4](http://localhost:5173/mate/bishop-knight#fen=8/2KB4/8/8/2k5/3N4/8/8_w_-_-_0_1&moves=Bf5,Kd5,Bd7,Kc4&cursor=0) |
| 181 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B6/2K5/8_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 182 | 0 | 2 | no | [Kd7 Kc5 Kc7 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/N1K5/2B5/8/3k4/8/8/8_w_-_-_0_1&moves=Kd7,Kc5,Kc7,Kd4&cursor=0) |
| 183 | 0 | 2 | no | [Kb5 Kd4 Kb6 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/1KB5/4k3/1N6/8/8/8_w_-_-_0_1&moves=Kb5,Kd4,Kb6,Ke5&cursor=0) |
| 184 | 0 | 2 | no | [Kc7 Kd4 Kd7 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/3K4/1NB5/2k5/8/8/8/8_w_-_-_0_1&moves=Kc7,Kd4,Kd7,Kc5&cursor=0) |
| 185 | 0 | 2 | no | [Bh1 Kc8 Bc6 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/1KB5/2N5/8/8/8/8_w_-_-_0_1&moves=Bh1,Kc8,Bc6,Kb8&cursor=0) |
| 186 | 0 | 2 | no | [Bb5 Kc3 Bc6 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/1KB5/2N5/1k6/8/8/8_w_-_-_0_1&moves=Bb5,Kc3,Bc6,Kb4&cursor=0) |
| 187 | 0 | 2 | no | [Be4 Kc4 Bc6 Kb3](http://localhost:5173/mate/bishop-knight#fen=8/8/1KB5/8/8/1k6/2N5/8_w_-_-_0_1&moves=Be4,Kc4,Bc6,Kb3&cursor=0) |
| 188 | 0 | 2 | no | [Bf3 Kc3 Bd5 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/8/1N1k4/5K2/8_w_-_-_0_1&moves=Bf3,Kc3,Bd5,Kd3&cursor=0) |
| 189 | 0 | 2 | no | [Kd7 Kc5 Kc7 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/2K5/2B5/N7/3k4/8/8/8_w_-_-_0_1&moves=Kd7,Kc5,Kc7,Kd4&cursor=0) |
| 190 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/5K2/2B5/8/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 191 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B6/5K2/8_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 192 | 0 | 2 | no | [Nb3 Kc4 Nd2+ Kd3](http://localhost:5173/mate/bishop-knight#fen=8/2K5/8/8/B7/3k4/3N4/8_w_-_-_0_1&moves=Nb3,Kc4,Nd2%2B,Kd3&cursor=0) |
| 193 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B3K1/8/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 194 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/8/8/3k2K1/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 195 | 0 | 2 | no | [Kc7 Ke5 Kb6 Kd4](http://localhost:5173/mate/bishop-knight#fen=6B1/8/1K6/8/3k4/8/N7/8_w_-_-_0_1&moves=Kc7,Ke5,Kb6,Kd4&cursor=0) |
| 196 | 0 | 2 | no | [Ba6 Kd5 Bb7 Ke4](http://localhost:5173/mate/bishop-knight#fen=8/1B6/2N5/8/4k3/8/5K2/8_w_-_-_0_1&moves=Ba6,Kd5,Bb7,Ke4&cursor=0) |
| 197 | 0 | 2 | no | [Kf2 Ke4 Kg3 Kf5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/5k2/8/1N4K1/B7/8_w_-_-_0_1&moves=Kf2,Ke4,Kg3,Kf5&cursor=0) |
| 198 | 0 | 2 | no | [Bf3 Kg5 Ba8 Kh4](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/7k/4N3/5K2/8_w_-_-_0_1&moves=Bf3,Kg5,Ba8,Kh4&cursor=0) |
| 199 | 0 | 2 | no | [Nd2+ Kd3 Nb3 Kc4](http://localhost:5173/mate/bishop-knight#fen=2B5/3K4/8/8/2k5/1N6/8/8_w_-_-_0_1&moves=Nd2%2B,Kd3,Nb3,Kc4&cursor=0) |
| 200 | 0 | 2 | no | [Bc8 Kc6 Ba6 Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/Bk6/1N6/1K6/8/8/8_w_-_-_0_1&moves=Bc8,Kc6,Ba6,Kb6&cursor=0) |
| 201 | 0 | 2 | no | [Bh1 Ke5 Bc6 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/6K1/N7/8/8/8_w_-_-_0_1&moves=Bh1,Ke5,Bc6,Kd6&cursor=0) |
| 202 | 0 | 2 | no | [Bd5 Kd2 Bb3 Kc1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/1K6/1BN5/8/2k5_w_-_-_0_1&moves=Bd5,Kd2,Bb3,Kc1&cursor=0) |
| 203 | 0 | 2 | no | [Bc6 Kb6 Bb5 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/8/1BN5/1K6/8/8/8_w_-_-_0_1&moves=Bc6,Kb6,Bb5,Ka7&cursor=0) |
| 204 | 0 | 2 | no | [Bf1 Kd6 Bb5 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/8/1BN5/1K6/8/8/8_w_-_-_0_1&moves=Bf1,Kd6,Bb5,Kc7&cursor=0) |
| 205 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B6/3K4/8_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 206 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=N7/8/2Bk4/1K6/8/8/8/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 207 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/N7/8/8/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 208 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/N7/8/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 209 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/N1Bk4/1K6/8/8/8/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 210 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/8/N7/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 211 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/8/8/N7_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 212 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/1N6/8/8/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 213 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/1N6/8/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 214 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/8/1N6/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 215 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/8/8/1N6_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 216 | 0 | 2 | no | [Kb6 Kd4 Kb5 Kc3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/1KN5/8/2k5/8/8_w_-_-_0_1&moves=Kb6,Kd4,Kb5,Kc3&cursor=0) |
| 217 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1KN5/8/8/8/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 218 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/2N5/8/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 219 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/8/2N5/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 220 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/8/8/2N5_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 221 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K1N4/8/8/8/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 222 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/8/3N4/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 223 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/8/8/3N4_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 224 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/4N3/8/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 225 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/8/4N3/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 226 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/8/8/4N3_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 227 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/8/5N2/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 228 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/8/8/5N2_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 229 | 0 | 2 | no | [Kc7 Kd4 Kd7 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/3K4/2B5/2k5/8/8/3N4/8_w_-_-_0_1&moves=Kc7,Kd4,Kd7,Kc5&cursor=0) |
| 230 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/8/8/6N1_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 231 | 0 | 2 | no | [Kc7 Kd4 Kd7 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/3K4/2B5/2k5/8/8/8/3N4_w_-_-_0_1&moves=Kc7,Kd4,Kd7,Kc5&cursor=0) |
| 232 | 0 | 2 | no | [Kc7 Kd4 Kd7 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/3K4/2B5/2k5/8/8/5N2/8_w_-_-_0_1&moves=Kc7,Kd4,Kd7,Kc5&cursor=0) |
| 233 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/8/6N1/8_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 234 | 0 | 2 | no | [Kc7 Kd4 Kd7 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/3K4/2B5/2k5/8/8/8/4N3_w_-_-_0_1&moves=Kc7,Kd4,Kd7,Kc5&cursor=0) |
| 235 | 0 | 2 | no | [Kc7 Kd4 Kd7 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/3K4/2B5/2k5/8/8/8/5N2_w_-_-_0_1&moves=Kc7,Kd4,Kd7,Kc5&cursor=0) |
| 236 | 0 | 2 | no | [Kc7 Kd4 Kd7 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/3K4/2B5/2k5/8/8/8/6N1_w_-_-_0_1&moves=Kc7,Kd4,Kd7,Kc5&cursor=0) |
| 237 | 0 | 2 | no | [Kb6 Ke5 Kb5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/1K6/8/8/8/7N_w_-_-_0_1&moves=Kb6,Ke5,Kb5,Kd6&cursor=0) |
| 238 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B6/4K3/8_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 239 | 0 | 2 | no | [Be6 Ke5 Bc8 Kd4](http://localhost:5173/mate/bishop-knight#fen=2B5/8/N7/8/1K1k4/8/8/8_w_-_-_0_1&moves=Be6,Ke5,Bc8,Kd4&cursor=0) |
| 240 | 0 | 2 | no | [Bc4 Kd4 Ba6 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/4K3/B7/4k3/8/8/8/5N2_w_-_-_0_1&moves=Bc4,Kd4,Ba6,Ke5&cursor=0) |
| 241 | 0 | 2 | no | [Bb3 Kc1 Bd5 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/1K6/N7/1k6/8_w_-_-_0_1&moves=Bb3,Kc1,Bd5,Kb2&cursor=0) |
| 242 | 0 | 2 | no | [Bb3 Kc1 Bd5 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/1K6/2N5/1k6/8_w_-_-_0_1&moves=Bb3,Kc1,Bd5,Kb2&cursor=0) |
| 243 | 0 | 2 | no | [Kb3 Kd2 Kb4 Kc1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/1K1N4/8/8/2k5_w_-_-_0_1&moves=Kb3,Kd2,Kb4,Kc1&cursor=0) |
| 244 | 0 | 2 | no | [Be2 Kg3 Ba6 Kf2](http://localhost:5173/mate/bishop-knight#fen=8/8/B7/8/8/4N3/3K1k2/8_w_-_-_0_1&moves=Be2,Kg3,Ba6,Kf2&cursor=0) |
| 245 | 0 | 2 | no | [Nb7 Kc6 Na5+ Kb5](http://localhost:5173/mate/bishop-knight#fen=2B5/8/8/Nk4K1/8/8/8/8_w_-_-_0_1&moves=Nb7,Kc6,Na5%2B,Kb5&cursor=0) |
| 246 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/6K1/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 247 | 0 | 2 | no | [Bd7 Kd6 Bc6 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/N3k1K1/8/8/8/8_w_-_-_0_1&moves=Bd7,Kd6,Bc6,Ke5&cursor=0) |
| 248 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/8/6K1/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 249 | 0 | 2 | no | [Ba4 Kb1 Bb3 Kc1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3N4/1BK5/8/2k5_w_-_-_0_1&moves=Ba4,Kb1,Bb3,Kc1&cursor=0) |
| 250 | 0 | 2 | no | [Nb7 Kc6 Na5+ Kb5](http://localhost:5173/mate/bishop-knight#fen=2B5/8/5K2/Nk6/8/8/8/8_w_-_-_0_1&moves=Nb7,Kc6,Na5%2B,Kb5&cursor=0) |
| 251 | 0 | 2 | no | [Bd3 Kf4 Ba6 Ke3](http://localhost:5173/mate/bishop-knight#fen=8/8/B7/8/3N4/2K1k3/8/8_w_-_-_0_1&moves=Bd3,Kf4,Ba6,Ke3&cursor=0) |
| 252 | 0 | 2 | no | [Bb7 Ke3 Ba6 Kf2](http://localhost:5173/mate/bishop-knight#fen=8/8/B7/8/3N4/2K5/5k2/8_w_-_-_0_1&moves=Bb7,Ke3,Ba6,Kf2&cursor=0) |
| 253 | 0 | 2 | no | [Nc6 Ke4 Na7+ Ke3](http://localhost:5173/mate/bishop-knight#fen=B7/N7/8/8/8/2K1k3/8/8_w_-_-_0_1&moves=Nc6,Ke4,Na7%2B,Ke3&cursor=0) |
| 254 | 0 | 2 | no | [Nd5+ Ke4 Nb6+ Ke3](http://localhost:5173/mate/bishop-knight#fen=B7/8/1N6/8/8/2K1k3/8/8_w_-_-_0_1&moves=Nd5%2B,Ke4,Nb6%2B,Ke3&cursor=0) |
| 255 | 0 | 2 | no | [Bh1 Ke5 Bc6 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/2Bk4/8/N7/2K5/8/8_w_-_-_0_1&moves=Bh1,Ke5,Bc6,Kd6&cursor=0) |
| 256 | 0 | 2 | no | [Bc6 Kc5 Bb5 Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/1B6/3N4/2K5/8/8_w_-_-_0_1&moves=Bc6,Kc5,Bb5,Kb6&cursor=0) |
| 257 | 0 | 2 | no | [Bc6 Ke3 Bb5 Kf2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1B6/3N4/2K5/5k2/8_w_-_-_0_1&moves=Bc6,Ke3,Bb5,Kf2&cursor=0) |
| 258 | 0 | 2 | no | [Bg4 Ke4 Be6 Ke3](http://localhost:5173/mate/bishop-knight#fen=8/8/4BK2/8/8/4k3/4N3/8_w_-_-_0_1&moves=Bg4,Ke4,Be6,Ke3&cursor=0) |
| 259 | 0 | 2 | no | [Ba6 Ke4 Bc4 Ke3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2B5/2KNk3/8/8_w_-_-_0_1&moves=Ba6,Ke4,Bc4,Ke3&cursor=0) |
| 260 | 0 | 2 | no | [Bf1 Ke5 Bc4 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/3k4/8/2BN4/2K5/8/8_w_-_-_0_1&moves=Bf1,Ke5,Bc4,Kd6&cursor=0) |
| 261 | 0 | 2 | no | [Bd5 Ke3 Bc4 Kf2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2BN4/2K5/5k2/8_w_-_-_0_1&moves=Bd5,Ke3,Bc4,Kf2&cursor=0) |
| 262 | 0 | 2 | no | [Bd5 Ke5 Bc4 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/2BN4/2K5/8/8_w_-_-_0_1&moves=Bd5,Ke5,Bc4,Kf6&cursor=0) |
| 263 | 0 | 2 | no | [Bd5 Ke5 Bc4 Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2BN1k2/2K5/8/8_w_-_-_0_1&moves=Bd5,Ke5,Bc4,Kf4&cursor=0) |
| 264 | 0 | 2 | no | [Nb3+ Ke4 Nc5+ Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/4BK2/2N5/3k4/8/8/8_w_-_-_0_1&moves=Nb3%2B,Ke4,Nc5%2B,Kd4&cursor=0) |
| 265 | 0 | 2 | no | [Bc4 Ke4 Be6 Kf3](http://localhost:5173/mate/bishop-knight#fen=8/8/4BK2/8/8/5k2/4N3/8_w_-_-_0_1&moves=Bc4,Ke4,Be6,Kf3&cursor=0) |
| 266 | 0 | 2 | no | [Bg4 Ke4 Be6 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/4BK2/8/8/3k4/4N3/8_w_-_-_0_1&moves=Bg4,Ke4,Be6,Kd3&cursor=0) |
| 267 | 0 | 2 | no | [Bb5 Kb6 Bc6 Ka5](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/k7/3N4/2K5/8/8_w_-_-_0_1&moves=Bb5,Kb6,Bc6,Ka5&cursor=0) |
| 268 | 0 | 2 | no | [Nb4+ Kc4 Nc2 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B2K2/8/8/3k4/2N5/8_w_-_-_0_1&moves=Nb4%2B,Kc4,Nc2,Kd3&cursor=0) |
| 269 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B3K2/8/8_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 270 | 0 | 2 | no | [Bf5 Kf4 Bc8 Ke3](http://localhost:5173/mate/bishop-knight#fen=2B5/8/N7/8/8/2K1k3/8/8_w_-_-_0_1&moves=Bf5,Kf4,Bc8,Ke3&cursor=0) |
| 271 | 0 | 2 | no | [Bf5 Kf4 Bd7 Ke3](http://localhost:5173/mate/bishop-knight#fen=8/3B4/8/1N6/8/2K1k3/8/8_w_-_-_0_1&moves=Bf5,Kf4,Bd7,Ke3&cursor=0) |
| 272 | 0 | 2 | no | [Ba2 Ke4 Bc4 Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2KNk3/2B5/8/8/8_w_-_-_0_1&moves=Ba2,Ke4,Bc4,Ke5&cursor=0) |
| 273 | 0 | 2 | no | [Bg8 Kd6 Bc4 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2k5/2B2K2/8/4N3/8_w_-_-_0_1&moves=Bg8,Kd6,Bc4,Kc5&cursor=0) |
| 274 | 0 | 2 | no | [Bh1 Kb6 Bc6 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/2BK4/2N5/8/8/8/8_w_-_-_0_1&moves=Bh1,Kb6,Bc6,Ka7&cursor=0) |
| 275 | 0 | 2 | no | [Bh1 Kb4 Bc6 Ka5](http://localhost:5173/mate/bishop-knight#fen=8/8/2BK4/k1N5/8/8/8/8_w_-_-_0_1&moves=Bh1,Kb4,Bc6,Ka5&cursor=0) |
| 276 | 0 | 2 | no | [Bh1 Kc7 Bc6 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/2B5/2K5/3N4/8/8/8_w_-_-_0_1&moves=Bh1,Kc7,Bc6,Kb8&cursor=0) |
| 277 | 0 | 2 | no | [Bh1 Ke7 Bc6 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/2B5/2K5/3N4/8/8/8_w_-_-_0_1&moves=Bh1,Ke7,Bc6,Kd8&cursor=0) |
| 278 | 0 | 2 | no | [Bd5 Kc3 Bc4 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2K5/2BN4/8/1k6/8_w_-_-_0_1&moves=Bd5,Kc3,Bc4,Kb2&cursor=0) |
| 279 | 0 | 2 | no | [Bg4 Ke4 Be6 Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/3KB3/8/8/3k4/4N3/8_w_-_-_0_1&moves=Bg4,Ke4,Be6,Kd3&cursor=0) |
| 280 | 0 | 2 | no | [Na5+ Kb5 Nb7 Kc6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/2k5/8/8/1B2K3/8/8_w_-_-_0_1&moves=Na5%2B,Kb5,Nb7,Kc6&cursor=0) |
| 281 | 0 | 2 | no | [Kc3 Ke5 Kd3 Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2BN1k2/3K4/8/8_w_-_-_0_1&moves=Kc3,Ke5,Kd3,Kf4&cursor=0) |
| 282 | 0 | 2 | no | [Kd4 Kf6 Kc5 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/8/2KB4/2N5/8/8/8_w_-_-_0_1&moves=Kd4,Kf6,Kc5,Kg7&cursor=0) |
| 283 | 0 | 2 | no | [Bc4 Kd2 Bd5 Kc3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2KB4/3N4/2k5/8/8_w_-_-_0_1&moves=Bc4,Kd2,Bd5,Kc3&cursor=0) |
| 284 | 0 | 2 | no | [Kd6 Kf6 Kc5 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/8/2KB4/3N4/8/8/8_w_-_-_0_1&moves=Kd6,Kf6,Kc5,Kg7&cursor=0) |
| 285 | 0 | 2 | no | [Bf3 Kd3 Bd5 Kc2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2KB4/8/8/2k5/3N4_w_-_-_0_1&moves=Bf3,Kd3,Bd5,Kc2&cursor=0) |
| 286 | 0 | 2 | no | [Be4 Kb4 Bc6 Kc4](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/8/N1k5/4K3/8/8_w_-_-_0_1&moves=Be4,Kb4,Bc6,Kc4&cursor=0) |
| 287 | 0 | 2 | no | [Kc5 Ke3 Kd6 Kf4](http://localhost:5173/mate/bishop-knight#fen=8/8/3K4/3B4/5k2/8/1N6/8_w_-_-_0_1&moves=Kc5,Ke3,Kd6,Kf4&cursor=0) |
| 288 | 0 | 2 | no | [Kf4 Kd6 Ke3 Kc5](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/2k5/8/4K3/N7/8_w_-_-_0_1&moves=Kf4,Kd6,Ke3,Kc5&cursor=0) |
| 289 | 0 | 2 | no | [Bf3 Kh4 Ba8 Kg3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/8/4K1k1/5N2/8_w_-_-_0_1&moves=Bf3,Kh4,Ba8,Kg3&cursor=0) |
| 290 | 0 | 2 | no | [Bf3 Ke1 Ba8 Kf2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/5K2/4N3/5k2/8_w_-_-_0_1&moves=Bf3,Ke1,Ba8,Kf2&cursor=0) |
| 291 | 0 | 2 | no | [Bf3 Kh4 Ba8 Kg3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/8/3N4/4K1k1/8/8_w_-_-_0_1&moves=Bf3,Kh4,Ba8,Kg3&cursor=0) |
| 292 | 0 | 2 | no | [Ke5 Ka5 Kd4 Ka6](http://localhost:5173/mate/bishop-knight#fen=8/8/k7/3N4/3K4/8/B7/8_w_-_-_0_1&moves=Ke5,Ka5,Kd4,Ka6&cursor=0) |
| 293 | 0 | 2 | no | [Ke5 Ka6 Kd4 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/8/3N4/3K4/8/B7/8_w_-_-_0_1&moves=Ke5,Ka6,Kd4,Ka7&cursor=0) |
| 294 | 0 | 2 | no | [Ba2 Kc6 Bc4 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/3k4/3N4/2BK4/8/8/8_w_-_-_0_1&moves=Ba2,Kc6,Bc4,Kd6&cursor=0) |
| 295 | 0 | 2 | no | [Ke5 Kc2 Kd4 Kd2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3N4/3K4/8/B2k4/8_w_-_-_0_1&moves=Ke5,Kc2,Kd4,Kd2&cursor=0) |
| 296 | 0 | 2 | no | [Ke5 Kg5 Kd4 Kg6](http://localhost:5173/mate/bishop-knight#fen=8/8/6k1/3N4/3K4/8/B7/8_w_-_-_0_1&moves=Ke5,Kg5,Kd4,Kg6&cursor=0) |
| 297 | 0 | 2 | no | [Ke5 Kf2 Kd4 Kg2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3N4/3K4/8/B5k1/8_w_-_-_0_1&moves=Ke5,Kf2,Kd4,Kg2&cursor=0) |
| 298 | 0 | 2 | no | [Ke5 Kf2 Kd4 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3N4/3K4/6k1/B7/8_w_-_-_0_1&moves=Ke5,Kf2,Kd4,Kg3&cursor=0) |
| 299 | 0 | 2 | no | [Ke5 Kg6 Kd4 Kg7](http://localhost:5173/mate/bishop-knight#fen=8/6k1/8/3N4/3K4/8/B7/8_w_-_-_0_1&moves=Ke5,Kg6,Kd4,Kg7&cursor=0) |
| 300 | 0 | 2 | no | [Ke5 Kd2 Kd4 Ke1](http://localhost:5173/mate/bishop-knight#fen=8/1N6/B7/8/3K4/8/8/4k3_w_-_-_0_1&moves=Ke5,Kd2,Kd4,Ke1&cursor=0) |
| 301 | 0 | 2 | no | [Ke5 Kf3 Kd4 Kg2](http://localhost:5173/mate/bishop-knight#fen=8/1N6/B7/8/3K4/8/6k1/8_w_-_-_0_1&moves=Ke5,Kf3,Kd4,Kg2&cursor=0) |
| 302 | 0 | 2 | no | [Ke5 Kf3 Kd4 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/1N6/B7/8/3K4/6k1/8/8_w_-_-_0_1&moves=Ke5,Kf3,Kd4,Kg3&cursor=0) |
| 303 | 0 | 2 | no | [Ke5 Kc6 Kd4 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/B7/8/2NK4/8/8/8_w_-_-_0_1&moves=Ke5,Kc6,Kd4,Kc7&cursor=0) |
| 304 | 0 | 2 | no | [Kd4 Kc6 Ke5 Kb6](http://localhost:5173/mate/bishop-knight#fen=2B5/8/Nk6/4K3/8/8/8/8_w_-_-_0_1&moves=Kd4,Kc6,Ke5,Kb6&cursor=0) |
| 305 | 0 | 2 | no | [Be6+ Kb5 Bc8 Kc4](http://localhost:5173/mate/bishop-knight#fen=2B5/8/N7/4K3/2k5/8/8/8_w_-_-_0_1&moves=Be6%2B,Kb5,Bc8,Kc4&cursor=0) |
| 306 | 0 | 2 | no | [Bf1 Kb4 Bc4 Ka5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/kN6/2BK4/8/8/8_w_-_-_0_1&moves=Bf1,Kb4,Bc4,Ka5&cursor=0) |
| 307 | 0 | 2 | no | [Ke5 Kb3 Kd4 Kc2](http://localhost:5173/mate/bishop-knight#fen=B7/1N6/8/8/3K4/8/2k5/8_w_-_-_0_1&moves=Ke5,Kb3,Kd4,Kc2&cursor=0) |
| 308 | 0 | 2 | no | [Ke5 Kg5 Kd4 Kg4](http://localhost:5173/mate/bishop-knight#fen=B7/1N6/8/8/3K2k1/8/8/8_w_-_-_0_1&moves=Ke5,Kg5,Kd4,Kg4&cursor=0) |
| 309 | 0 | 2 | no | [Ke5 Kg6 Kd4 Kg5](http://localhost:5173/mate/bishop-knight#fen=B7/1N6/8/6k1/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kg6,Kd4,Kg5&cursor=0) |
| 310 | 0 | 2 | no | [Ke5 Kf7 Kd4 Kg6](http://localhost:5173/mate/bishop-knight#fen=B7/1N6/6k1/8/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kf7,Kd4,Kg6&cursor=0) |
| 311 | 0 | 2 | no | [Ke5 Ka3 Kd4 Ka2](http://localhost:5173/mate/bishop-knight#fen=B7/8/2N5/8/3K4/8/k7/8_w_-_-_0_1&moves=Ke5,Ka3,Kd4,Ka2&cursor=0) |
| 312 | 0 | 2 | no | [Ke5 Ka3 Kd4 Kb2](http://localhost:5173/mate/bishop-knight#fen=B7/8/2N5/8/3K4/8/1k6/8_w_-_-_0_1&moves=Ke5,Ka3,Kd4,Kb2&cursor=0) |
| 313 | 0 | 2 | no | [Ke5 Kb3 Kd4 Kc2](http://localhost:5173/mate/bishop-knight#fen=B7/8/2N5/8/3K4/8/2k5/8_w_-_-_0_1&moves=Ke5,Kb3,Kd4,Kc2&cursor=0) |
| 314 | 0 | 2 | no | [Ke5 Kg5 Kd4 Kg4](http://localhost:5173/mate/bishop-knight#fen=B7/8/2N5/8/3K2k1/8/8/8_w_-_-_0_1&moves=Ke5,Kg5,Kd4,Kg4&cursor=0) |
| 315 | 0 | 2 | no | [Ke5 Kg6 Kd4 Kg5](http://localhost:5173/mate/bishop-knight#fen=B7/8/2N5/6k1/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kg6,Kd4,Kg5&cursor=0) |
| 316 | 0 | 2 | no | [Ke5 Kf7 Kd4 Kg6](http://localhost:5173/mate/bishop-knight#fen=B7/8/2N3k1/8/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kf7,Kd4,Kg6&cursor=0) |
| 317 | 0 | 2 | no | [Ke5 Kf8 Kd4 Kg7](http://localhost:5173/mate/bishop-knight#fen=B7/6k1/2N5/8/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kf8,Kd4,Kg7&cursor=0) |
| 318 | 0 | 2 | no | [Ke5 Kf8 Kd4 Kg8](http://localhost:5173/mate/bishop-knight#fen=B5k1/8/2N5/8/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kf8,Kd4,Kg8&cursor=0) |
| 319 | 0 | 2 | no | [Ke5 Ka3 Kd4 Ka2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/3N4/3K4/8/k7/8_w_-_-_0_1&moves=Ke5,Ka3,Kd4,Ka2&cursor=0) |
| 320 | 0 | 2 | no | [Ke5 Ka4 Kd4 Ka3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/3N4/3K4/k7/8/8_w_-_-_0_1&moves=Ke5,Ka4,Kd4,Ka3&cursor=0) |
| 321 | 0 | 2 | no | [Ke5 Ka5 Kd4 Ka4](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/3N4/k2K4/8/8/8_w_-_-_0_1&moves=Ke5,Ka5,Kd4,Ka4&cursor=0) |
| 322 | 0 | 2 | no | [Ke5 Ka6 Kd4 Ka5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/k2N4/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Ka6,Kd4,Ka5&cursor=0) |
| 323 | 0 | 2 | no | [Ba8 Ka7 Bc6 Ka6](http://localhost:5173/mate/bishop-knight#fen=8/8/k1B5/3N4/3K4/8/8/8_w_-_-_0_1&moves=Ba8,Ka7,Bc6,Ka6&cursor=0) |
| 324 | 0 | 2 | no | [Ke5 Ka3 Kd4 Kb2](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/3N4/3K4/8/1k6/8_w_-_-_0_1&moves=Ke5,Ka3,Kd4,Kb2&cursor=0) |
| 325 | 0 | 2 | no | [Ke5 Ka4 Kd4 Kb3](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/3N4/3K4/1k6/8/8_w_-_-_0_1&moves=Ke5,Ka4,Kd4,Kb3&cursor=0) |
| 326 | 0 | 2 | no | [Ba8 Kb8 Bc6 Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/2B5/3N4/3K4/8/8/8_w_-_-_0_1&moves=Ba8,Kb8,Bc6,Kc8&cursor=0) |
| 327 | 0 | 2 | no | [Ke5 Kc8 Kd4 Kd8](http://localhost:5173/mate/bishop-knight#fen=B2k4/8/8/3N4/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kc8,Kd4,Kd8&cursor=0) |
| 328 | 0 | 2 | no | [Ke5 Kg5 Kd4 Kg4](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/3N4/3K2k1/8/8/8_w_-_-_0_1&moves=Ke5,Kg5,Kd4,Kg4&cursor=0) |
| 329 | 0 | 2 | no | [Ke5 Kd8 Kd4 Ke8](http://localhost:5173/mate/bishop-knight#fen=B3k3/8/8/3N4/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kd8,Kd4,Ke8&cursor=0) |
| 330 | 0 | 2 | no | [Ke5 Ke8 Kd4 Kf8](http://localhost:5173/mate/bishop-knight#fen=B4k2/8/8/3N4/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Ke8,Kd4,Kf8&cursor=0) |
| 331 | 0 | 2 | no | [Ke5 Kg6 Kd4 Kg5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/3N2k1/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kg6,Kd4,Kg5&cursor=0) |
| 332 | 0 | 2 | no | [Ke5 Kf7 Kd4 Kg6](http://localhost:5173/mate/bishop-knight#fen=B7/8/6k1/3N4/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kf7,Kd4,Kg6&cursor=0) |
| 333 | 0 | 2 | no | [Ke5 Kf8 Kd4 Kg7](http://localhost:5173/mate/bishop-knight#fen=B7/6k1/8/3N4/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kf8,Kd4,Kg7&cursor=0) |
| 334 | 0 | 2 | no | [Ke5 Kf8 Kd4 Kg8](http://localhost:5173/mate/bishop-knight#fen=B5k1/8/8/3N4/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kf8,Kd4,Kg8&cursor=0) |
| 335 | 0 | 2 | no | [Ba4 Kd2 Bb5 Ke1](http://localhost:5173/mate/bishop-knight#fen=8/8/2N5/1B6/3K4/8/8/4k3_w_-_-_0_1&moves=Ba4,Kd2,Bb5,Ke1&cursor=0) |
| 336 | 0 | 2 | no | [Ba4 Kf3 Bb5 Kg2](http://localhost:5173/mate/bishop-knight#fen=8/8/2N5/1B6/3K4/8/6k1/8_w_-_-_0_1&moves=Ba4,Kf3,Bb5,Kg2&cursor=0) |
| 337 | 0 | 2 | no | [Bc8 Kc6 Be6 Kb5](http://localhost:5173/mate/bishop-knight#fen=8/8/N3B3/1k2K3/8/8/8/8_w_-_-_0_1&moves=Bc8,Kc6,Be6,Kb5&cursor=0) |
| 338 | 0 | 2 | no | [Kd4 Kb4 Ke5 Kb3](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/4K3/N7/1k6/8/8_w_-_-_0_1&moves=Kd4,Kb4,Ke5,Kb3&cursor=0) |
| 339 | 0 | 2 | no | [Nd2 Kf2 Nb3 Kg3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/3K4/1N4k1/8/8_w_-_-_0_1&moves=Nd2,Kf2,Nb3,Kg3&cursor=0) |
| 340 | 0 | 2 | no | [Ke5 Kc7 Kd4 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/8/3B4/2NK4/8/8/8_w_-_-_0_1&moves=Ke5,Kc7,Kd4,Kb8&cursor=0) |
| 341 | 0 | 2 | no | [Kd4 Kd7 Ke5 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/8/3BK3/2N5/8/8/8_w_-_-_0_1&moves=Kd4,Kd7,Ke5,Kc7&cursor=0) |
| 342 | 0 | 2 | no | [Kd4 Kc7 Ke5 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/8/3BK3/2N5/8/8/8_w_-_-_0_1&moves=Kd4,Kc7,Ke5,Kb8&cursor=0) |
| 343 | 0 | 2 | no | [Be8 Kf6 Bd7 Kg5](http://localhost:5173/mate/bishop-knight#fen=8/3B4/2N5/6k1/3K4/8/8/8_w_-_-_0_1&moves=Be8,Kf6,Bd7,Kg5&cursor=0) |
| 344 | 0 | 2 | no | [Be8+ Kf6 Bd7 Kg6](http://localhost:5173/mate/bishop-knight#fen=8/3B4/2N3k1/8/3K4/8/8/8_w_-_-_0_1&moves=Be8%2B,Kf6,Bd7,Kg6&cursor=0) |
| 345 | 0 | 2 | no | [Bc6 Kb6 Be8 Ka5](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/kN6/3K4/8/8/8_w_-_-_0_1&moves=Bc6,Kb6,Be8,Ka5&cursor=0) |
| 346 | 0 | 2 | no | [Ke5 Kh6 Kd4 Kg5](http://localhost:5173/mate/bishop-knight#fen=4B3/8/2N5/6k1/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kh6,Kd4,Kg5&cursor=0) |
| 347 | 0 | 2 | no | [Ke5 Kc2 Kd4 Kb2](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/3N4/3K4/8/1k6/8_w_-_-_0_1&moves=Ke5,Kc2,Kd4,Kb2&cursor=0) |
| 348 | 0 | 2 | no | [Ke5 Kc8 Kd4 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k4B1/8/8/3N4/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kc8,Kd4,Kb8&cursor=0) |
| 349 | 0 | 2 | no | [Ke5 Kd8 Kd4 Kc8](http://localhost:5173/mate/bishop-knight#fen=2k3B1/8/8/3N4/3K4/8/8/8_w_-_-_0_1&moves=Ke5,Kd8,Kd4,Kc8&cursor=0) |
| 350 | 0 | 2 | no | [Ke5 Kg5 Kd4 Kg4](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/3N4/3K2k1/8/8/8_w_-_-_0_1&moves=Ke5,Kg5,Kd4,Kg4&cursor=0) |

## Terminal outcomes and limits

| Starting status | Can reach mate, D4 / physical | Can reach capture/stalemate, D4 / physical |
|---|---:|---:|
| all | 1,355,042 / 10,838,668 | 316,287 / 2,529,520 |
| supported | 2,353 / 18,824 | 107 / 856 |
| unsupported | 1,352,689 / 10,819,844 | 316,180 / 2,528,664 |

This is an exhaustive placement census (distinct squares and nonadjacent kings), not retrograde reachability from the initial chess position. It follows the app’s best-move policy, not every legal Black defense, and ignores clocks and repetition claims. Mate, stalemate, or a capturable minor terminates a branch. A supported root uses the app’s fresh Black reply; later nodes preserve its return-history rule. A few census placements may have no legal preceding White move (for example an impossible double check); those are explicitly marked census-only and receive no broken replay URL. No production preferences or support definitions were changed for this audit.
