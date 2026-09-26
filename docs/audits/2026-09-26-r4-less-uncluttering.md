# Narrower r4 uncluttering — 2026-09-26

An ordinary edge bishop two steps from White king no longer triggers r4. The wider two-step zone now applies only in corners, where there is one inward diagonal direction. Elsewhere r4 requires bishop/White-king adjacency and Black or the knight within two steps of the bishop. The result separation threshold uses the same corner distinction. Rule text is unchanged.

After Bf1 Ke6 in the supplied line, r4 is neutral for every candidate and Ke4 is preferred. Verified in all eight D4 orientations. Existing corner-blocking and king-exit-clearing regressions still pass. Ba6 is now a valid uncluttering destination from Bb7 beside Kc6; Ba8 remains rejected.

## Replay

98 of the 15,917 saved D4 four-ply witnesses survive, down from 183. 86 previous witnesses broke; one older saved witness reappeared (a net reduction of 85). 64 survivors are hidden by the all-White-pieces-middle-16 display filter, leaving 34. The r4/r5 motif falls from 73 to 1.

Largest visible motif: r4/r6, 19 cycles. Next: r6.5/r8, 8 cycles. Only two cycles of the largest motif satisfy the joint orientation requirements (bishop and Black nearer a8 than h1), so this report supplies two rather than inventing or relabeling ten. Each example was verified for preferred White moves, legal Black replies, four-ply closure, D4 uniqueness and terminal/degenerate exclusions every ply.

This replays saved four-ply witnesses; it does not establish a new global count or search newly introduced cycles. The full-audit baseline pointer remains unchanged.

## Validation

Build passes; all 15 tests in the two changed regression files pass. The broad run exposed two superseded r4 expectations, now updated; the same four pre-existing failures in unchanged files remain.

## Examples

- **r4 ↔ r6**: [Bh3, Kc4, Be6+, Kc5](http://localhost:5173/mate/bishop-knight#fen=8/3K4/4B3/2k5/8/8/N7/8_w_-_-_0_1&moves=Bh3,Kc4,Be6%2B,Kc5&cursor=0)
- **r4 ↔ r6**: [Bh1, Kc4, Bd5+, Kb5](http://localhost:5173/mate/bishop-knight#fen=8/8/3K4/1k1B4/8/8/N7/8_w_-_-_0_1&moves=Bh1,Kc4,Bd5%2B,Kb5&cursor=0)
- **r6.5 ↔ r8**: [Bb7, Kc7, Ba8, Kb8](http://localhost:5173/mate/bishop-knight#fen=Bk6/8/8/2NK4/8/8/8/8_w_-_-_0_1&moves=Bb7,Kc7,Ba8,Kb8&cursor=0)
- **r6.5 ↔ r8**: [Bc6, Kc7, Ba4, Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/8/4K3/B3N3/8/8/8_w_-_-_0_1&moves=Bc6,Kc7,Ba4,Kd8&cursor=0)
