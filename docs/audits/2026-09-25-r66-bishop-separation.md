# r6.6: separate the bishop from a noncentral king

Add r6.6 immediately after r6.5. It activates when the starting bishop is adjacent to White’s king and that king lies outside files c–f / ranks 3–6. Prefer bishop moves ending at least three king steps from Black’s king; among qualifying moves, maximize Euclidean distance from White’s king. Moves that fail the threshold tie neutrally with one another. Earlier priorities are preserved.

For the supplied Kb6/Bb5/Nc5 versus Kb4 position, r6.6 prefers Bf1, but r5 still selects Na6+. With Black instead on a3, r5 is inactive and r6.6 uniquely selects Bf1. Both behaviors, the three-step boundary, starting-position activation, and D4 symmetry are covered by tests.

Saved four-ply witnesses: 90 → 90; 0 broken, 0 revived. All 4,847 saved witnesses were replayed. No newly introduced cycles were searched, so this is not a current full-domain total.

64 surviving cycles are hidden by the middle-16 display filter, leaving 26. Terminal and degenerate positions remain excluded.

Build and 12 focused tests passed. The full bishop-knight suite has 141 passing tests and the same four previously recorded failures.

## Largest display-eligible motif

15 knight shuffles with king protection throughout and alternating stable bishop protection.

1. [Na6+ Ka3 Nc5 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/1K6/1BN5/1k6/8/8/8_w_-_-_0_1&moves=Na6%2B,Ka3,Nc5,Kb4&cursor=0)
2. [Nc5+ Kb4 Na6+ Kb3](http://localhost:5173/mate/bishop-knight#fen=8/8/NK6/1B6/8/1k6/8/8_w_-_-_0_1&moves=Nc5%2B,Kb4,Na6%2B,Kb3&cursor=0)
3. [Nc5 Kb4 Na6+ Kc3](http://localhost:5173/mate/bishop-knight#fen=8/8/NK6/1B6/8/2k5/8/8_w_-_-_0_1&moves=Nc5,Kb4,Na6%2B,Kc3&cursor=0)
4. [Nb7+ Ke5 Nc5 Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/1KBk4/2N5/8/8/8/8_w_-_-_0_1&moves=Nb7%2B,Ke5,Nc5,Kd6&cursor=0)
5. [Nc5+ Kd6 Nb7+ Ke6](http://localhost:5173/mate/bishop-knight#fen=8/1N6/1KB1k3/8/8/8/8/8_w_-_-_0_1&moves=Nc5%2B,Kd6,Nb7%2B,Ke6&cursor=0)
6. [Nc5 Kd6 Nb7+ Ke7](http://localhost:5173/mate/bishop-knight#fen=8/1N2k3/1KB5/8/8/8/8/8_w_-_-_0_1&moves=Nc5,Kd6,Nb7%2B,Ke7&cursor=0)
7. [Nb3+ Kb6 Nd4 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2k5/2BN4/2K5/8/8_w_-_-_0_1&moves=Nb3%2B,Kb6,Nd4,Kc5&cursor=0)
8. [Nd4+ Kc5 Nb3+ Kc6](http://localhost:5173/mate/bishop-knight#fen=8/8/2k5/8/2B5/1NK5/8/8_w_-_-_0_1&moves=Nd4%2B,Kc5,Nb3%2B,Kc6&cursor=0)
9. [Nd4 Kc5 Nb3+ Kd6](http://localhost:5173/mate/bishop-knight#fen=8/8/3k4/8/2B5/1NK5/8/8_w_-_-_0_1&moves=Nd4,Kc5,Nb3%2B,Kd6&cursor=0)
10. [Na8+ Kd6 Nb6 Kc7](http://localhost:5173/mate/bishop-knight#fen=8/KBk5/1N6/8/8/8/8/8_w_-_-_0_1&moves=Na8%2B,Kd6,Nb6,Kc7&cursor=0)

## Another motif

6 knight shuffles with king protection throughout and no stable bishop protection.

11. [Nb7+ Kd5 Nc5+ Kd6](http://localhost:5173/mate/bishop-knight#fen=B7/8/1K1k4/2N5/8/8/8/8_w_-_-_0_1&moves=Nb7%2B,Kd5,Nc5%2B,Kd6&cursor=0)
12. [Nb8+ Kd8 Nc6+ Kd7](http://localhost:5173/mate/bishop-knight#fen=B7/1K1k4/2N5/8/8/8/8/8_w_-_-_0_1&moves=Nb8%2B,Kd8,Nc6%2B,Kd7&cursor=0)
