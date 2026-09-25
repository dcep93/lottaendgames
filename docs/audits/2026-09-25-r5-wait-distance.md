# r5 bishop waiting move: maximize distance from Black

During the bishop-wait stage only, r5 maximizes bishop Euclidean distance from Black’s king. Equal distances remain tied for later priorities. Keep the displayed rule text unchanged and update the diagram caption. Mate, piece safety, and stalemate priorities remain ahead of r5.

The reported loop now selects Bh7. Tests cover this across all D4 transforms, a Bf7/Bh5 distance tie, and neutral scoring outside the waiting stage. All 19 targeted tests and the production build pass.

Saved-loop replay: 79 of the original full audit’s 2,467 four-ply witnesses survive, down from 87. Eight recorded cycles broken; none reactivated. This is not a new full-domain total and does not measure new or longer cycles. Largest surviving saved motif: 61 central bishop shuffles; second: 11 off-center bishop shuffles.

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
11. [Bb5 Kb6 Be8 Kc5](http://localhost:5173/mate/bishop-knight#fen=4B3/8/8/2k5/8/2NK4/8/8_w_-_-_0_1&moves=Bb5,Kb6,Be8,Kc5&cursor=0)
12. [Ba4 Kd8 Bc6 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/2B5/8/4K3/5N2/8/8_w_-_-_0_1&moves=Ba4,Kd8,Bc6,Kc7&cursor=0)
