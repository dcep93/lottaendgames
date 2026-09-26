# r4 must end with the bishop clear — 2026-09-26

The previous change narrowed when r4 activated but still credited a bishop move that ended inside White’s king crowding zone. In `3k4/1B6/2K5/8/8/8/8/7N w - - 2 2`, this wrongly allowed Ba8 behind Kc6.

An r4 bishop relocation now requires both conditions in the resulting position:

- At least three king steps from Black’s king.
- Outside White’s king crowding range: more than two steps for an edge bishop, more than one otherwise.

The existing king exit-clearing option remains. Both the initial Ba8 position and the resulting Bb7 position now prefer Kc5 or Kd6. The D4 regression rejects credit for both Ba8–b7 and Bb7–a8. Rule text stays short and unchanged.

## Saved loop replay

**3,898 / 15,917** old four-ply witnesses survive; **12,019 break**, including **all 7,870 original r4-versus-r4 loops**. This removes another 3,338 witnesses beyond the preceding change. These are replays of the last full audit, not a current global total; newly introduced and longer cycles were not searched. Full-audit baseline remains unchanged.

All examples below use current preferred White moves, legal Black replies, D4 deduplication, exclusions at every ply, and the middle-16 display filter. White arrangements are distinct and wide; Black starts closer to a8 than h1.

## Surviving motifs

| Last deciding rules | Saved four-ply cycles |
| --- | ---: |
| r4 ↔ r6 | 2,227 |
| r20 ↔ r4 | 1,463 |
| r4 ↔ r5 | 73 |
| r8 ↔ r8 | 66 |
| r20 ↔ r20 | 41 |
| r6.5 ↔ r8 | 8 |
| r20 ↔ r6 | 6 |
| r4 ↔ r8 | 3 |
| r20 ↔ r8 | 3 |
| r7 ↔ r7 | 3 |
| r20 ↔ r6.5 | 3 |
| r20 ↔ r5 | 1 |
| r6 ↔ r8 | 1 |

## Ten examples: r4 ↔ r6

1. [Bb3 Ka6 Bg8 Ka7](http://localhost:5173/mate/bishop-knight#fen=6B1/k7/8/8/K7/8/8/3N4_w_-_-_0_1&moves=Bb3,Ka6,Bg8,Ka7&cursor=0) — `6B1/k7/8/8/K7/8/8/3N4 w - - 0 1`.
2. [Bf3 Kd8 Ba8 Kc8](http://localhost:5173/mate/bishop-knight#fen=B1k5/8/8/8/6K1/8/8/3N4_w_-_-_0_1&moves=Bf3,Kd8,Ba8,Kc8&cursor=0) — `B1k5/8/8/8/6K1/8/8/3N4 w - - 0 1`.
3. [Bh7 Kc4 Bg8+ Kb4](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/7K/1k6/8/8/1N6_w_-_-_0_1&moves=Bh7,Kc4,Bg8%2B,Kb4&cursor=0) — `6B1/8/8/7K/1k6/8/8/1N6 w - - 0 1`.
4. [Bh7 Ka3 Bg8 Ka4](http://localhost:5173/mate/bishop-knight#fen=6B1/4K3/8/8/k7/8/N7/8_w_-_-_0_1&moves=Bh7,Ka3,Bg8,Ka4&cursor=0) — `6B1/4K3/8/8/k7/8/N7/8 w - - 0 1`.
5. [Bh7 Ka4 Bg8 Kb5](http://localhost:5173/mate/bishop-knight#fen=4K1B1/8/8/1k6/8/8/N7/8_w_-_-_0_1&moves=Bh7,Ka4,Bg8,Kb5&cursor=0) — `4K1B1/8/8/1k6/8/8/N7/8 w - - 0 1`.
6. [Bc4 Kb2 Bg8 Ka3](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/1K6/8/k7/8/5N2_w_-_-_0_1&moves=Bc4,Kb2,Bg8,Ka3&cursor=0) — `6B1/8/8/1K6/8/k7/8/5N2 w - - 0 1`.
7. [Bf5 Kf7 Bc8 Ke8](http://localhost:5173/mate/bishop-knight#fen=2B1k3/8/8/8/6K1/8/8/1N6_w_-_-_0_1&moves=Bf5,Kf7,Bc8,Ke8&cursor=0) — `2B1k3/8/8/8/6K1/8/8/1N6 w - - 0 1`.
8. [Bf5 Kd4 Bc8 Kc4](http://localhost:5173/mate/bishop-knight#fen=2B5/8/8/6K1/2k5/8/8/1N6_w_-_-_0_1&moves=Bf5,Kd4,Bc8,Kc4&cursor=0) — `2B5/8/8/6K1/2k5/8/8/1N6 w - - 0 1`.
9. [Bc4 Kd6 Bg8 Ke7](http://localhost:5173/mate/bishop-knight#fen=6B1/4k3/8/8/1K6/8/8/5N2_w_-_-_0_1&moves=Bc4,Kd6,Bg8,Ke7&cursor=0) — `6B1/4k3/8/8/1K6/8/8/5N2 w - - 0 1`.
10. [Bh7 Kb3 Bg8+ Ka4](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/6K1/k7/8/8/1N6_w_-_-_0_1&moves=Bh7,Kb3,Bg8%2B,Ka4&cursor=0) — `6B1/8/8/6K1/k7/8/8/1N6 w - - 0 1`.

## Two examples: r20 ↔ r4

1. [Bh3 Ka1 Bc8 Ka2](http://localhost:5173/mate/bishop-knight#fen=2B5/8/8/7K/8/8/k7/5N2_w_-_-_0_1&moves=Bh3,Ka1,Bc8,Ka2&cursor=0) — `2B5/8/8/7K/8/8/k7/5N2 w - - 0 1`.
2. [Bg4 Ka1 Bc8 Ka2](http://localhost:5173/mate/bishop-knight#fen=2B5/8/8/7K/8/8/k3N3/8_w_-_-_0_1&moves=Bg4,Ka1,Bc8,Ka2&cursor=0) — `2B5/8/8/7K/8/8/k3N3/8 w - - 0 1`.

## Validation

Production build passes. All eight focused r4 tests pass, including D4 transforms. The broader bishop-and-knight suite has 148 passes and the same four pre-existing failures. Every selected replay was verified under current rules.
