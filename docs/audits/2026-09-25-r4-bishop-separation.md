# Promote bishop separation from r6.6 to r4

Move the unchanged bishop-separation rule ahead of r5, retaining mate, piece safety and stalemate priorities. Both Kb6/Bb5/Nc5 versus Kb4 and the loaded Kb6/Bb5/Na6 versus Ka3 now uniquely select Bf1 under r4, across all D4 transforms.

The earlier Bf7/Kf8 blocked-drift fixture now chooses Ba2 under r4. Its r6 comparator still prefers Nc4 over Nb7; the regression retains this geometric assertion while checking the new overall priority.

Saved four-ply witnesses: 90 → 78; 12 broken, 0 revived. All 4,847 saved witnesses were replayed; newly introduced cycles were not searched. This is not a current domain total.

64 are hidden by the middle-16 display filter, leaving 14. Terminal and degenerate exclusions remain active.

Build, 12 focused registration/separation tests, and all 19 drift tests passed. Four broader-suite failures predate this change.


## Largest display-eligible motif

knight shuffle; bishop outside center throughout; knight king-protected throughout; no stable bishop defense: 6 cycles.

1. [Nb7+ Kd5 Nc5+ Kd6](http://localhost:5173/mate/bishop-knight#fen=B7/8/1K1k4/2N5/8/8/8/8_w_-_-_0_1&moves=Nb7%2B,Kd5,Nc5%2B,Kd6&cursor=0)
2. [Nb8+ Kd8 Nc6+ Kd7](http://localhost:5173/mate/bishop-knight#fen=B7/1K1k4/2N5/8/8/8/8/8_w_-_-_0_1&moves=Nb8%2B,Kd8,Nc6%2B,Kd7&cursor=0)
3. [Nc6+ Ka8 Nb4 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Ka7&cursor=0)
4. [Nc6+ Ka8 Nb4 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Kb8&cursor=0)
5. [Nc5+ Kd6 Nb7+ Kd7](http://localhost:5173/mate/bishop-knight#fen=B7/1N1k4/1K6/8/8/8/8/8_w_-_-_0_1&moves=Nc5%2B,Kd6,Nb7%2B,Kd7&cursor=0)
6. [Nc6 Kb5 Na7+ Kc5](http://localhost:5173/mate/bishop-knight#fen=B7/NK6/8/2k5/8/8/8/8_w_-_-_0_1&moves=Nc6,Kb5,Na7%2B,Kc5&cursor=0)

## Another motif

knight shuffle; bishop outside center throughout; knight king-protected throughout; alternates stable bishop defense: 3 cycles.

7. [Nb3+ Kb6 Nd4 Kc5](http://localhost:5173/mate/bishop-knight#fen=8/8/8/2k5/2BN4/2K5/8/8_w_-_-_0_1&moves=Nb3%2B,Kb6,Nd4,Kc5&cursor=0)
8. [Nd4+ Kc5 Nb3+ Kc6](http://localhost:5173/mate/bishop-knight#fen=8/8/2k5/8/2B5/1NK5/8/8_w_-_-_0_1&moves=Nd4%2B,Kc5,Nb3%2B,Kc6&cursor=0)
