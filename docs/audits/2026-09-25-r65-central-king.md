# r6.5: adjacency to a central White king

An attacked bishop receives the adjacency preference only when White’s king occupies d4, e4, d5, or e5. Otherwise r6.5 maximizes bishop distance from Black’s king. Already king-defended bishops remain exempt.

The supplied Bc4/Kf1/Nf2 versus Kc3 position now uniquely prefers Bg8, across all eight D4 transforms.

Saved four-ply witnesses: 187 → 101; 86 broken, 0 revived. This replays all 4,847 witnesses from the last full audit; it does not count newly introduced cycles or establish a current domain total.

64 surviving cycles are hidden because both White-turn positions place all White pieces in the middle 16. Terminal and degenerate positions remain excluded.

Build passed. Focused tests: 16/16. Bishop-knight suite: 137 passing, with the same four previously recorded failures.

## Largest display-eligible motif

knight shuffle; bishop outside center throughout; knight king-protected throughout; alternates stable bishop defense: 22 cycles.

1. [Nc5 Kd4 Nb3+ Ke5](http://localhost:5173/mate/bishop-knight#fen=8/8/4B3/4k3/1K6/1N6/8/8_w_-_-_0_1&moves=Nc5,Kd4,Nb3%2B,Ke5&cursor=0)
2. [Nc3 Kd4 Ne2+ Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1Bk5/8/8/3KN3/8_w_-_-_0_1&moves=Nc3,Kd4,Ne2%2B,Kc5&cursor=0)
3. [Nd2 Ke3 Nf1+ Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2Bk4/8/8/4KN2_w_-_-_0_1&moves=Nd2,Ke3,Nf1%2B,Kd4&cursor=0)
4. [Nb6 Kc5 Na4+ Kd6](http://localhost:5173/mate/bishop-knight#fen=8/3B4/3k4/K7/N7/8/8/8_w_-_-_0_1&moves=Nb6,Kc5,Na4%2B,Kd6&cursor=0)
5. [Nb2 Kc3 Nd1+ Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/Bk6/8/8/2KN4_w_-_-_0_1&moves=Nb2,Kc3,Nd1%2B,Kb4&cursor=0)
6. [Ne3 Kd2 Nf1+ Kc3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2B5/2k5/5K2/5N2_w_-_-_0_1&moves=Ne3,Kd2,Nf1%2B,Kc3&cursor=0)
7. [Nd4 Kc5 Nb3+ Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/3kB3/8/8/1NK5/8/8_w_-_-_0_1&moves=Nd4,Kc5,Nb3%2B,Kd6&cursor=0)
8. [Na6+ Ka3 Nc5 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/1K6/1BN5/1k6/8/8/8_w_-_-_0_1&moves=Na6%2B,Ka3,Nc5,Kb4&cursor=0)
9. [Nc5+ Kb4 Na6+ Kb3](http://localhost:5173/mate/bishop-knight#fen=8/8/NK6/1B6/8/1k6/8/8_w_-_-_0_1&moves=Nc5%2B,Kb4,Na6%2B,Kb3&cursor=0)
10. [Nc5 Kb4 Na6+ Kc3](http://localhost:5173/mate/bishop-knight#fen=8/8/NK6/1B6/8/2k5/8/8_w_-_-_0_1&moves=Nc5,Kb4,Na6%2B,Kc3&cursor=0)

## Another motif

knight shuffle; bishop outside center throughout; knight king-protected throughout; no stable bishop defense: 6 cycles.

11. [Nb7+ Kd5 Nc5+ Kd6](http://localhost:5173/mate/bishop-knight#fen=B7/8/1K1k4/2N5/8/8/8/8_w_-_-_0_1&moves=Nb7%2B,Kd5,Nc5%2B,Kd6&cursor=0)
12. [Nb8+ Kd8 Nc6+ Kd7](http://localhost:5173/mate/bishop-knight#fen=B7/1K1k4/2N5/8/8/8/8/8_w_-_-_0_1&moves=Nb8%2B,Kd8,Nc6%2B,Kd7&cursor=0)
