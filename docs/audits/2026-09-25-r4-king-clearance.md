# r4: clear a bishop exit with the king

When r4 is active, a king move may unclutter the bishop by vacating a diagonally adjacent square. Bishop moves retain their existing distance preference, and subsequent rules break ties between king moves. The visible r4 text is unchanged.

After Nb8+ Kd8 in the supplied line, Ka7 clears b7 for Ba8. R4 rejects the reverse knight move Nc6+; r6 then selects Ka7 among clearing king moves because it retains protection of Nb8. Tests cover this through all eight D4 transforms and reject ordinary king moves that clear no bishop exit.

Saved four-ply witnesses: 72 → 68; 4 broken, 0 revived. All 4,847 saved witnesses were replayed. New cycles were not searched; this is not a current domain total.

64 survivors are hidden by the middle-16 display filter, leaving 4. Terminal and degenerate exclusions remain active. Three examples additionally meet the requested orientation constraints.

Build and 16 focused registration/separation tests pass. The full bishop-knight suite has 145 passing tests and the same four previously recorded failures.


## Largest display-eligible motif

bishop shuffle; bishop outside center throughout; knight king-protected throughout; no stable bishop defense: 2 cycles.

1. [Bc6 Kc7 Bb7 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/1B6/8/2NK4/8/8/8/8_w_-_-_0_1&moves=Bc6,Kc7,Bb7,Kb8&cursor=0)
2. [Bd3 Kc3 Bb5 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1B6/1k1NK3/8/8/8_w_-_-_0_1&moves=Bd3,Kc3,Bb5,Kb4&cursor=0)

## Another motif

bishop shuffle; bishop outside center throughout; knight king-protected throughout; stable bishop defense: 2 cycles.

3. [Bb7 Ke4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/2KNk3/8/8/8/8_w_-_-_0_1&moves=Bb7,Ke4,Ba8,Ke5&cursor=0)
