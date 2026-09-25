# r5: save an attacked bishop before advancing

For White Kd2/Ne2/Bb5 versus Black Kc5, r5 proposed Ke3. Piece safety rejected that advance because Bb5 would be hanging, leaving r6 to select Nc3. Black could then play Kd4, causing r5 to return the knight with Ne2+.

The r5 advance geometry now uses its bishop-wait step if the proposed king destination leaves an attacked bishop defended by neither king nor knight. No legal-response search or history is needed. Existing r5 wait scoring maximizes bishop distance from Black. The supplied position now uniquely chooses Be8; Nc3 fails r5. Visible rule text is unchanged.

Saved four-ply witnesses: 101 → 90; 11 broken, 0 revived. All 4,847 witnesses from the last full audit were replayed. This does not detect new cycles or establish a current domain total.

64 survivors are hidden because both White-turn positions place all White pieces in the middle 16. Terminal and degenerate positions remain excluded.

Build passed. R5 tests: 12/12, including D4 checks of the supplied position and a knight-defended bishop that still permits the king advance. Full bishop-knight suite: 139 passing, with the same four previously recorded failures.

## Largest display-eligible motif

knight shuffle; bishop outside center throughout; knight king-protected throughout; alternates stable bishop defense: 15 cycles.

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

knight shuffle; bishop outside center throughout; knight king-protected throughout; no stable bishop defense: 6 cycles.

11. [Nb7+ Kd5 Nc5+ Kd6](http://localhost:5173/mate/bishop-knight#fen=B7/8/1K1k4/2N5/8/8/8/8_w_-_-_0_1&moves=Nb7%2B,Kd5,Nc5%2B,Kd6&cursor=0)
12. [Nb8+ Kd8 Nc6+ Kd7](http://localhost:5173/mate/bishop-knight#fen=B7/1K1k4/2N5/8/8/8/8/8_w_-_-_0_1&moves=Nb8%2B,Kd8,Nc6%2B,Kd7&cursor=0)
