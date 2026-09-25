# r4: clear a nearby edge bishop before crowding its exit

Keep the visible rule text unchanged. With a noncentral White king, r4 now activates for an edge bishop within two king steps of White’s king; nonedge bishops retain the adjacency trigger. Destination scoring is unchanged: at least three king steps from Black, then maximize Euclidean distance from White’s king.

For Ba8/Kb6/Nc5 versus Kd6, Nb7+ would block the corner bishop’s only exit. R4 now uniquely selects Bh1 first, across all eight D4 transforms. This is a local distance check, not a legal-response search or loop-history check. Tests preserve inactivity for an edge bishop three steps from White’s king.

Saved four-ply witnesses: 75 → 72; 3 broken, 0 revived. All 4,847 saved witnesses were replayed. New cycles were not searched; this is not a current domain total.

64 survivors are hidden by the middle-16 display filter, leaving 8. Terminal and degenerate exclusions remain active.

Build and 14 focused tests pass. The full bishop-knight suite has 143 passing tests and the same four previously recorded failures.


## Largest display-eligible motif

knight shuffle; bishop outside center throughout; knight king-protected throughout; no stable bishop defense: 4 cycles.

1. [Nb8+ Kd8 Nc6+ Kd7](http://localhost:5173/mate/bishop-knight#fen=B7/1K1k4/2N5/8/8/8/8/8_w_-_-_0_1&moves=Nb8%2B,Kd8,Nc6%2B,Kd7&cursor=0)
2. [Nc6+ Ka8 Nb4 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Ka7&cursor=0)
3. [Nc6+ Ka8 Nb4 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Kb8&cursor=0)
4. [Nc6 Kb5 Na7+ Kc5](http://localhost:5173/mate/bishop-knight#fen=B7/NK6/8/2k5/8/8/8/8_w_-_-_0_1&moves=Nc6,Kb5,Na7%2B,Kc5&cursor=0)

## Another motif

bishop shuffle; bishop outside center throughout; knight king-protected throughout; no stable bishop defense: 2 cycles.

5. [Bc6 Kc7 Bb7 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/1B6/8/2NK4/8/8/8/8_w_-_-_0_1&moves=Bc6,Kc7,Bb7,Kb8&cursor=0)
6. [Bd3 Kc3 Bb5 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1B6/1k1NK3/8/8/8_w_-_-_0_1&moves=Bd3,Kc3,Bb5,Kb4&cursor=0)
