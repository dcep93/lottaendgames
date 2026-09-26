# R4.5 immediate proximity only — 2026-09-26

The user rejected anticipatory bishop-clearance scoring that forced a knight retreat solely to prevent Black approaching the bishop on the following turn. R4.5 now uses only bishop adjacency to Black in the candidate position. It does not enumerate Black replies for this preference or reward additional distance. Its displayed text is unchanged.

The reported line now prefers **Ne4**, followed by **Bg8** after **Ka3**. A D4 regression checks all eight symmetries, and separate coverage confirms that an already adjacent bishop still triggers clearance.

## Bounded loop check

Of the 843 surviving four-ply witnesses from the preceding change, **136 remain and 707 are eliminated**. All 136 also belonged to the last full audit's 1,562 cycles. A five-second mixed search found 18 cycles, all already known. This does not establish a new global on-cycle position total or exclude newly introduced loops elsewhere.

43 of the 136 witnesses pass the middle-16 display filter. The largest raw group is 84 central bishop shuttles, all hidden by that filter. The largest display-eligible broad motif is knight shuffling without king protection, with the bishop outside the center (38 cycles). The alternate examples keep the knight king-protected. Every link is D4-distinct and verified for preferred White moves, legal Black replies, closure, terminal/degenerate exclusions, and display constraints. Wider White bounding rectangles come first.

## Examples

1. [Nd4+ Kc3 Nb5+ Kb3](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/1N6/8/1k6/8/K7_w_-_-_0_1&moves=Nd4%2B,Kc3,Nb5%2B,Kb3&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
2. [Nd4+ Kc3 Nb5+ Kb3](http://localhost:5173/mate/bishop-knight#fen=8/3B4/8/1N6/8/1k6/8/K7_w_-_-_0_1&moves=Nd4%2B,Kc3,Nb5%2B,Kb3&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
3. [Nd4 Ke5 Nc6+ Kd6](http://localhost:5173/mate/bishop-knight#fen=7K/8/B1Nk4/8/8/8/8/8_w_-_-_0_1&moves=Nd4,Ke5,Nc6%2B,Kd6&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
4. [Nd4 Kc3 Nb5+ Kb4](http://localhost:5173/mate/bishop-knight#fen=2B5/8/8/1N6/1k6/8/8/K7_w_-_-_0_1&moves=Nd4,Kc3,Nb5%2B,Kb4&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
5. [Nd4+ Kc3 Nb5+ Kb3](http://localhost:5173/mate/bishop-knight#fen=2B5/8/8/1N6/8/1k6/8/K7_w_-_-_0_1&moves=Nd4%2B,Kc3,Nb5%2B,Kb3&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
6. [Nb8 Kc7 Na6+ Kd6](http://localhost:5173/mate/bishop-knight#fen=6B1/5K2/N2k4/8/8/8/8/8_w_-_-_0_1&moves=Nb8,Kc7,Na6%2B,Kd6&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
7. [Na3 Kb4 Nc2+ Kc5](http://localhost:5173/mate/bishop-knight#fen=B7/1K6/8/2k5/8/8/2N5/8_w_-_-_0_1&moves=Na3,Kb4,Nc2%2B,Kc5&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
8. [Nb2+ Kc3 Nd1+ Kc4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/K7/B1k5/8/8/3N4_w_-_-_0_1&moves=Nb2%2B,Kc3,Nd1%2B,Kc4&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
9. [Nc7+ Kd6 Nb5+ Ke6](http://localhost:5173/mate/bishop-knight#fen=4BK2/8/4k3/1N6/8/8/8/8_w_-_-_0_1&moves=Nc7%2B,Kd6,Nb5%2B,Ke6&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
10. [Nb4+ Kc5 Nd3+ Kc6](http://localhost:5173/mate/bishop-knight#fen=8/K7/B1k5/8/8/3N4/8/8_w_-_-_0_1&moves=Nb4%2B,Kc5,Nd3%2B,Kc6&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
11. [Bd3 Kc3 Bb5 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1B6/1k1NK3/8/8/8_w_-_-_0_1&moves=Bd3,Kc3,Bb5,Kb4&cursor=0) — minor-piece shuffle while knight remains king-protected.
12. [Nc7+ Kc5 Na6+ Kb5](http://localhost:5173/mate/bishop-knight#fen=B7/1K6/N7/1k6/8/8/8/8_w_-_-_0_1&moves=Nc7%2B,Kc5,Na6%2B,Kb5&cursor=0) — minor-piece shuffle while knight remains king-protected.

## Validation

35 targeted tests and the production TypeScript/Vite build pass. Only the r4.5 proximity criterion changed; safety priorities and other move rules are unchanged.
