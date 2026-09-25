# r20: determine undefended pieces before White moves

Freeze the set of undefended minor pieces in the starting position. For each candidate, maximize the resulting distance of those pieces from Black’s king, then apply the existing minor-piece central proximity tiebreak. The unprotected-piece count is fixed too: a move that gains defense cannot stop its piece from contributing to r20. Protection uses the existing king, knight, and stable-bishop definitions; r6 continues evaluating its own protection preferences after White moves.

The reported Be8/Kd3/Nc3 versus Kc5 position now chooses Bh5. Tests cover all D4 orientations, gaining defense without dropping out of the score, and leaving defense without entering the score. All 22 targeted tests and the production build pass. The full bishop-knight suite has only the four previously documented failures.

Saved-loop replay: 77 of the original full audit’s 2,467 four-ply witnesses survive, down from 79. Two broken; none reactivated. This is not a full-domain total or an arbitrary-cycle position-membership check.

The example selector now hides loops whose two White-to-move positions both have all three White pieces on c3–f6. These remain counted: 64 saved cycles are hidden and 13 are display-eligible. The largest display-eligible motif is 10 off-center bishop shuffles with a king-protected knight, followed by two knight shuffles.

## Verified examples

1. [Ba4 Kd8 Bc6 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/2B5/8/4K3/5N2/8/8_w_-_-_0_1&moves=Ba4,Kd8,Bc6,Kc7&cursor=0)
2. [Bc6 Kc7 Ba4 Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/8/8/B3K3/5N2/8/8_w_-_-_0_1&moves=Bc6,Kc7,Ba4,Kc8&cursor=0)
3. [Bc6 Kc7 Ba4 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/8/8/B3K3/5N2/8/8_w_-_-_0_1&moves=Bc6,Kc7,Ba4,Kb8&cursor=0)
4. [Bc6 Kc7 Ba4 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/8/4K3/B3N3/8/8/8_w_-_-_0_1&moves=Bc6,Kc7,Ba4,Kd8&cursor=0)
5. [Bc6 Kc7 Ba4 Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/8/4K3/B3N3/8/8/8_w_-_-_0_1&moves=Bc6,Kc7,Ba4,Kc8&cursor=0)
6. [Bc6 Kc7 Ba4 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/8/4K3/B3N3/8/8/8_w_-_-_0_1&moves=Bc6,Kc7,Ba4,Kb8&cursor=0)
7. [Ba4 Kb8 Bc6 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/2B5/8/3KN3/8/8/8_w_-_-_0_1&moves=Ba4,Kb8,Bc6,Kc7&cursor=0)
8. [Ba4 Kd6 Bc6 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/2k5/2B5/8/3NK3/8/8/8_w_-_-_0_1&moves=Ba4,Kd6,Bc6,Kc7&cursor=0)
9. [Bc6 Kc7 Ba4 Kc8](http://localhost:5173/mate/bishop-knight#fen=2k5/8/8/8/B2KN3/8/8/8_w_-_-_0_1&moves=Bc6,Kc7,Ba4,Kc8&cursor=0)
10. [Bc6 Kc7 Ba4 Kd8](http://localhost:5173/mate/bishop-knight#fen=3k4/8/8/8/B2KN3/8/8/8_w_-_-_0_1&moves=Bc6,Kc7,Ba4,Kd8&cursor=0)
11. [Nc6+ Ka8 Nb4 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Ka7&cursor=0)
12. [Nc6+ Ka8 Nb4 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Kb8&cursor=0)
