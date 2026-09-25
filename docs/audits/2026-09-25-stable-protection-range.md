# Stable bishop protection: Black within two knight-distance king steps

Stable bishop protection only counts when Black’s king is within two king steps of the knight. Filter candidate protected squares by that distance, retaining existing ray, blocker, edge-bishop, and x-ray rules. This shared helper serves r6, r20 and the protection-distance score. King protection remains independent of this restriction. Rule text is unchanged.

The loaded Ba6 / Kb6 / Nf1 / Black Kd6 position now prefers Ne3, rather than Bb5. Boundary tests cover distances two and three, and all eight D4 orientations. Older test expectations that treated distant bishop protection as stable were updated.

126 bishop-knight tests pass; the same four previously documented failures remain. Production build passes.

Of the previous full audit’s 2,467 four-ply witnesses, 100 survive, down from 125. This change breaks 25 and reactivates none of those witnesses. This is not a full-domain recount and does not measure newly introduced loops or positions on longer cycles.

Current motif classification was recomputed with the new stable-protection definition. The largest group is 61 central-bishop shuffles with a king-protected knight. The second is 23 off-center bishop shuffles with a king-protected knight and no stable bishop defense.

## Verified examples

1. [Be4 Ka2 Bd5+ Ka1](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/3K4/4N3/8/k7_w_-_-_0_1&moves=Be4,Ka2,Bd5%2B,Ka1&cursor=0)
2. [Be4 Ka1 Bd5 Kb2](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/3K4/4N3/1k6/8_w_-_-_0_1&moves=Be4,Ka1,Bd5,Kb2&cursor=0)
3. [Be4 Ka2 Bd5+ Ka3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/3K4/k3N3/8/8_w_-_-_0_1&moves=Be4,Ka2,Bd5%2B,Ka3&cursor=0)
4. [Be4 Ka3 Bd5 Ka4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/k2K4/4N3/8/8_w_-_-_0_1&moves=Be4,Ka3,Bd5,Ka4&cursor=0)
5. [Be4 Ka3 Bd5 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/3B4/1k1K4/4N3/8/8_w_-_-_0_1&moves=Be4,Ka3,Bd5,Kb4&cursor=0)
6. [Be4 Ka4 Bd5 Ka5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/k2B4/3K4/4N3/8/8_w_-_-_0_1&moves=Be4,Ka4,Bd5,Ka5&cursor=0)
7. [Be4 Ka4 Bd5 Kb5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1k1B4/3K4/4N3/8/8_w_-_-_0_1&moves=Be4,Ka4,Bd5,Kb5&cursor=0)
8. [Be4 Ka5 Bd5 Ka6](http://localhost:5173/mate/bishop-knight#fen=8/8/k7/3B4/3K4/4N3/8/8_w_-_-_0_1&moves=Be4,Ka5,Bd5,Ka6&cursor=0)
9. [Be4 Ka5 Bd5 Kb6](http://localhost:5173/mate/bishop-knight#fen=8/8/1k6/3B4/3K4/4N3/8/8_w_-_-_0_1&moves=Be4,Ka5,Bd5,Kb6&cursor=0)
10. [Be4 Ka6 Bd5 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/8/3B4/3K4/4N3/8/8_w_-_-_0_1&moves=Be4,Ka6,Bd5,Ka7&cursor=0)
11. [Bc4 Kd4 Bg8 Kc3](http://localhost:5173/mate/bishop-knight#fen=6B1/8/8/8/8/N1k5/K7/8_w_-_-_0_1&moves=Bc4,Kd4,Bg8,Kc3&cursor=0)
12. [Ba4 Kb4 Be8 Kc3](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/8/8/2k5/1N6/2K5_w_-_-_0_1&moves=Ba4,Kb4,Be8,Kc3&cursor=0)
