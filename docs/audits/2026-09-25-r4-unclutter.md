# r4: unclutter the bishop without a central White king

Visible text: “Without a central White king, unclutter the bishop.”

Broaden the existing adjacent-bishop separation trigger from kings outside the middle 16 to kings outside the central four (d4, e4, d5, e5). Keep the existing simple destination preference: bishop moves at least three king steps from Black, maximizing Euclidean distance from White’s king. Activation is determined before White moves.

The supplied Kc3/Bc4/Nd4 versus Kc5 position now uniquely chooses Bg8 under r4 across all eight D4 transforms. Tests also cover the c6 boundary, central-king exemption, and the starting-position condition. The older minor-fork fixture now chooses Bh1 under r4 while retaining its r6 knight-protection preference in isolation.

Saved four-ply witnesses: 78 → 75; 3 broken, 0 revived. All 4,847 saved witnesses were replayed. New cycles were not searched; this is not a current domain total.

64 survivors are hidden by the middle-16 display filter, leaving 11. Terminal and degenerate exclusions remain active.

Build, 13 focused registration/separation tests, and the updated minor-fork tests passed. Four broader-suite failures predate this change.


## Largest display-eligible motif

knight shuffle; bishop outside center throughout; knight king-protected throughout; no stable bishop defense: 6 cycles.

1. [Nb7+ Kd5 Nc5+ Kd6](http://localhost:5173/mate/bishop-knight#fen=B7/8/1K1k4/2N5/8/8/8/8_w_-_-_0_1&moves=Nb7%2B,Kd5,Nc5%2B,Kd6&cursor=0)
2. [Nb8+ Kd8 Nc6+ Kd7](http://localhost:5173/mate/bishop-knight#fen=B7/1K1k4/2N5/8/8/8/8/8_w_-_-_0_1&moves=Nb8%2B,Kd8,Nc6%2B,Kd7&cursor=0)
3. [Nc6+ Ka8 Nb4 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Ka7&cursor=0)
4. [Nc6+ Ka8 Nb4 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Kb8&cursor=0)
5. [Nc5+ Kd6 Nb7+ Kd7](http://localhost:5173/mate/bishop-knight#fen=B7/1N1k4/1K6/8/8/8/8/8_w_-_-_0_1&moves=Nc5%2B,Kd6,Nb7%2B,Kd7&cursor=0)
6. [Nc6 Kb5 Na7+ Kc5](http://localhost:5173/mate/bishop-knight#fen=B7/NK6/8/2k5/8/8/8/8_w_-_-_0_1&moves=Nc6,Kb5,Na7%2B,Kc5&cursor=0)

## Another motif

bishop shuffle; bishop outside center throughout; knight king-protected throughout; no stable bishop defense: 2 cycles.

7. [Bc6 Kc7 Bb7 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/1B6/8/2NK4/8/8/8/8_w_-_-_0_1&moves=Bc6,Kc7,Bb7,Kb8&cursor=0)
8. [Bd3 Kc3 Bb5 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1B6/1k1NK3/8/8/8_w_-_-_0_1&moves=Bd3,Kc3,Bb5,Kb4&cursor=0)
