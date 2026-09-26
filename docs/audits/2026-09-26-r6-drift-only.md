# r6 drift-only replay — 2026-09-26

r6 now reads: “Drift the knight towards king protection, then prefer knight central 16 proximity.” Removed the explicit king-protection and stable-bishop-protection comparison branches. Existing drift geometry and its central-16 tiebreak remain; safety and r20 still use defense metrics.

The reported Bg8/Bb3 shuttle now chooses Nc3 from the starting position, verified across all eight D4 transforms.

## Saved-cycle replay

Rechecked all 15,917 D4-distinct four-ply witnesses from the eecb6a9 full audit against the current preferred White moves. 183 survive; 119 remain after the display-only middle-16 filter. The previous replay had 3,898 survivors. This is not a global loop-position count: newly introduced loops and longer cycles were not searched.

Largest visible motif: 73 r4 ↔ r5 cycles. The r5 bishop waiting move approaches the White king, and r4 sends the bishop away again. Next visible motif: 19 r4 ↔ r6 cycles.

Examples use preferred White moves, legal Black replies, exact closure, D4 deduplication, terminal/degenerate exclusions at every ply, and the requested orientation and width ranking.

## Validation

Build passes. All 55 tests in the six changed test files pass. Superseded protection-first expectations were updated, retaining route-obstruction checks. Four existing failures remain in unchanged BishopProtection, KnightBishopDefense, and OppositePrecage tests; this change does not claim the entire suite passes.

## Largest motif: r4 ↔ r5

1. [Bf1, Ke6, Ba6, Kd5](http://localhost:5173/mate/bishop-knight#fen=8/8/B7/3k4/8/4KN2/8/8_w_-_-_0_1&moves=Bf1,Ke6,Ba6,Kd5&cursor=0) — `8/8/B7/3k4/8/4KN2/8/8 w - - 0 1`
2. [Bd1, Ke6, Ba4, Kd5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3k4/B7/4KN2/8/8_w_-_-_0_1&moves=Bd1,Ke6,Ba4,Kd5&cursor=0) — `8/8/8/3k4/B7/4KN2/8/8 w - - 0 1`
3. [Bb1, Kd6, Ba2, Ke7](http://localhost:5173/mate/bishop-knight#fen=8/4k3/8/8/2KN4/8/B7/8_w_-_-_0_1&moves=Bb1,Kd6,Ba2,Ke7&cursor=0) — `8/4k3/8/8/2KN4/8/B7/8 w - - 0 1`
4. [Bb1, Ke5, Ba2, Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/3k4/2N5/2K5/8/B7/8_w_-_-_0_1&moves=Bb1,Ke5,Ba2,Kd6&cursor=0) — `8/8/3k4/2N5/2K5/8/B7/8 w - - 0 1`
5. [Bd1, Ke6, Ba4, Kd5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3k4/B7/3NK3/8/8_w_-_-_0_1&moves=Bd1,Ke6,Ba4,Kd5&cursor=0) — `8/8/8/3k4/B7/3NK3/8/8 w - - 0 1`
6. [Be8, Ke4, Ba4, Kd5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3k4/B7/2K5/2N5/8_w_-_-_0_1&moves=Be8,Ke4,Ba4,Kd5&cursor=0) — `8/8/8/3k4/B7/2K5/2N5/8 w - - 0 1`
7. [Bb1, Ke5, Ba2, Ke6](http://localhost:5173/mate/bishop-knight#fen=8/8/4k3/8/2K5/2N5/B7/8_w_-_-_0_1&moves=Bb1,Ke5,Ba2,Ke6&cursor=0) — `8/8/4k3/8/2K5/2N5/B7/8 w - - 0 1`
8. [Be8, Ke4, Ba4, Kd5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3k4/B1N5/2K5/8/8_w_-_-_0_1&moves=Be8,Ke4,Ba4,Kd5&cursor=0) — `8/8/8/3k4/B1N5/2K5/8/8 w - - 0 1`
9. [Bd1, Ke5, Ba4, Ke6](http://localhost:5173/mate/bishop-knight#fen=8/8/4k3/8/B1K5/2N5/8/8_w_-_-_0_1&moves=Bd1,Ke5,Ba4,Ke6&cursor=0) — `8/8/4k3/8/B1K5/2N5/8/8 w - - 0 1`
10. [Bd1, Ke5, Ba4, Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/3k4/2N5/B1K5/8/8/8_w_-_-_0_1&moves=Bd1,Ke5,Ba4,Kd6&cursor=0) — `8/8/3k4/2N5/B1K5/8/8/8 w - - 0 1`

## Another motif: r4 ↔ r6

11. [Bh3, Kc4, Be6+, Kc5](http://localhost:5173/mate/bishop-knight#fen=8/3K4/4B3/2k5/8/8/N7/8_w_-_-_0_1&moves=Bh3,Kc4,Be6%2B,Kc5&cursor=0) — `8/3K4/4B3/2k5/8/8/N7/8 w - - 0 1`
12. [Bh1, Kc4, Bd5+, Kb5](http://localhost:5173/mate/bishop-knight#fen=8/8/3K4/1k1B4/8/8/N7/8_w_-_-_0_1&moves=Bh1,Kc4,Bd5%2B,Kb5&cursor=0) — `8/8/3K4/1k1B4/8/8/N7/8 w - - 0 1`
