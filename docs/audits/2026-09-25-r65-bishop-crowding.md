# r6.5: avoid crowding an escaping bishop beside both White pieces

When saving an attacked bishop, r6.5 first avoids bishop moves ending adjacent to both White’s king and knight. Its existing central-king protection and Black-distance preferences then apply. No visible rule text changes. Existing inactivity for unattacked or already king-protected bishops is preserved.

With Bb7/Kd5/Nc5 versus Kb8, Bc6 is adjacent to both White pieces. Ba6 is equally far from Black but stays clear of that cluster. Ba6 now uniquely wins under r6.5 through every D4 transform.

Saved four-ply witnesses: 68 → 66; 2 broken, 0 revived. All 4,847 saved witnesses were replayed. New cycles were not searched; this is not a current domain total.

64 survivors are hidden by the middle-16 display filter, leaving 2. Only one remaining example meets the requested orientation constraints. Terminal and degenerate exclusions remain active.

Build and 17 focused tests pass. The full bishop-knight suite has 146 passing tests and the same four previously recorded failures.

## Remaining display-eligible motif

Two bishop shuffles outside the center, with the knight protected by both king and stable bishop.

1. [Bb7 Ke4 Ba8 Ke5](http://localhost:5173/mate/bishop-knight#fen=B7/8/8/2KNk3/8/8/8/8_w_-_-_0_1&moves=Bb7,Ke4,Ba8,Ke5&cursor=0)
