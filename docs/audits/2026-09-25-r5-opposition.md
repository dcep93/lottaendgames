# r5: break opposition, wait if necessary, then advance

## Design

Use a small local geometry matcher rather than recorded move history or reply-tree search. With kings in orthogonal opposition blocking an inward step, prefer knight checks that land orthogonally adjacent to White’s king. Once the knight is beside the king, recognize Black two or three ranks/files ahead and at most one file/rank to either side. Prefer a legal inward king step beside the knight; if Black blocks it, r5 accepts every bishop move equally. Existing safety rules and later priorities choose among those waits. The original hop and reverse-hop anticipation remain fallbacks.

Displayed r5 text stays “Play the r5 move.” A second explanatory diagram shows Nb2–d1+ and Kc1–d2. No support declarations or loop exclusions changed.

## Verification

Both supplied lines pass across all eight D4 transforms: Nd1+ Kb3 Kd2, and Nd1+ Kd3 Bd7 Kd4 Kd2. At the waiting stage every legal bishop move has zero r5 penalty; non-bishop moves are penalized. Tests also cover translated geometry, outward opposition, and an occupied king destination.

17 targeted tests and the production build pass. Full bishop-knight suite: 128 pass; the same four pre-existing failures remain.

## Saved-loop replay

87 of the previous full audit’s 2,467 four-ply witnesses survive, down from 100. Thirteen recorded cycles were broken; none reactivated. This does not count newly introduced loops or positions on longer cycles. The largest surviving recorded group remains 61 central-bishop shuffles; the second group contains 14 off-center bishop shuffles.

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
12. [Bb5 Kb6 Be8 Kc5](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/2k5/8/2NK4/8/8_w_-_-_0_1&moves=Bb5,Kb6,Be8,Kc5&cursor=0)
