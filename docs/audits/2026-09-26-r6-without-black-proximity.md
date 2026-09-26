# R6 without Black-king proximity — 2026-09-26

R6 now prefers king step proximity to the knight, then Euclidean proximity to a central square. It no longer breaks ties using distance to Black. Later rules resolve those ties. Help text and notes agree with the comparator.

The first king-shuffle example from the full audit now selects Nd3, and the user's loaded position then selects Ke3. Both are checked across all eight D4 symmetries.

## Bounded loop check

Of the preceding full audit's 1,562 D4-distinct four-ply cycles, **843 survive and 719 no longer follow preferred White moves**. The previous 600-cycle king-shuffle archetype has 12 surviving witnesses, and all ten previously shown examples are eliminated. These figures concern exact four-ply witnesses; they do not establish how many prior positions still belong to a different or longer cycle.

A five-second mixed discovery search checked 237 roots (236 completed), found 104 cycles, all already in the surviving set. This is not a uniform population sample and provides no reliable global density estimate. The preceding full audit remains the last complete baseline; its 1,937 on-cycle position count does not describe this changed policy.

The broad largest surviving motif is **knight shuffling without king protection, bishop outside the center**, comprising 577 cycles: 301 without stable bishop defense and 276 alternating that defense. In the examples, a king-approach or drift preference advances the knight, then r4.5 sends it back to prevent Black approaching the bishop. The alternate examples are bishop shuttles with the knight continuously king-protected (36 cycles in that geometric group).

Terminal and degenerate states are excluded throughout each witness. The links exclude loops with all three White pieces inside the middle 16 on both White turns, use D4-distinct cycles, and prefer wide White bounding rectangles. Every link was verified against current preferred White moves, legal Black replies, and exact closure.

## Examples

1. [Nc3 Kb4 Nb1 Ka5](http://localhost:5173/mate/bishop-knight#fen=7K/8/8/k7/8/8/B7/1N6_w_-_-_0_1&moves=Nc3,Kb4,Nb1,Ka5&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
2. [Nc3 Kb4 Nb1 Ka5](http://localhost:5173/mate/bishop-knight#fen=6K1/8/8/k7/8/8/B7/1N6_w_-_-_0_1&moves=Nc3,Kb4,Nb1,Ka5&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
3. [Nc7+ Kc6 Na8 Kd5](http://localhost:5173/mate/bishop-knight#fen=N7/8/B7/3k4/8/8/7K/8_w_-_-_0_1&moves=Nc7%2B,Kc6,Na8,Kd5&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
4. [Nc3+ Kc4 Na2 Kd5](http://localhost:5173/mate/bishop-knight#fen=7K/8/8/3k4/B7/8/N7/8_w_-_-_0_1&moves=Nc3%2B,Kc4,Na2,Kd5&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
5. [Nb1 Kb5 Nc3+ Kb4](http://localhost:5173/mate/bishop-knight#fen=7K/8/8/8/1k6/2N5/B7/8_w_-_-_0_1&moves=Nb1,Kb5,Nc3%2B,Kb4&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
6. [Nc5+ Kd6 Na6 Ke6](http://localhost:5173/mate/bishop-knight#fen=8/1B6/N3k3/8/8/8/8/7K_w_-_-_0_1&moves=Nc5%2B,Kd6,Na6,Ke6&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
7. [Nd6 Ke7 Nb7 Kf8](http://localhost:5173/mate/bishop-knight#fen=2B2k2/1N6/8/8/8/8/7K/8_w_-_-_0_1&moves=Nd6,Ke7,Nb7,Kf8&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
8. [Nb1 Kb5 Nc3+ Kb4](http://localhost:5173/mate/bishop-knight#fen=6K1/8/8/8/1k6/2N5/B7/8_w_-_-_0_1&moves=Nb1,Kb5,Nc3%2B,Kb4&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
9. [Nc5+ Kd6 Na6 Ke6](http://localhost:5173/mate/bishop-knight#fen=8/1B6/N3k3/8/8/8/8/6K1_w_-_-_0_1&moves=Nc5%2B,Kd6,Na6,Ke6&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
10. [Nc3 Kb4 Nb1 Ka5](http://localhost:5173/mate/bishop-knight#fen=8/6K1/8/k7/8/8/B7/1N6_w_-_-_0_1&moves=Nc3,Kb4,Nb1,Ka5&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
11. [Ba8 Kd4 Bb7 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/1B6/8/2k5/8/5K2/5N2/8_w_-_-_0_1&moves=Ba8,Kd4,Bb7,Kc5&cursor=0) — bishop shuffle; bishop outside center throughout; knight king-protected throughout; no stable bishop defense.
12. [Ba8 Ke5 Bb7 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/1B6/3k4/8/8/4NK2/8/8_w_-_-_0_1&moves=Ba8,Ke5,Bb7,Kd6&cursor=0) — bishop shuffle; bishop outside center throughout; knight king-protected throughout; no stable bishop defense.

## Validation

21 targeted tests pass, including D4 regressions. Production TypeScript/Vite build passes. No other rule ordering or scoring changed.
