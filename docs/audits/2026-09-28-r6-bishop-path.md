# r6 bishop path, 2026-09-28

Replaces the old r6 opposition preference. Visible text: “When Black’s king prevents approach of the center, navigate the bishop to open a path.” No other numbered rule was reordered.

## Implementation

Before White moves, find more-central king steps, preserving existing king defense of the knight. Central proximity uses Euclidean distance to the nearest central-four square. Activate only if there is at least one prospective step and Black controls all of them. Route the bishop toward control of a same-color square where Black can maintain that blockade, including the current square and adjacent shuffling squares. Static bishop routes respect occupied squares and avoid unprotected attacked landings. The final bishop square must not occupy the proposed king step. Existing exact r4 navigation declarations take precedence.

This is geometric preparation, not a minimax guarantee of central advance against every reply. Earlier priorities still apply. In the loaded position, Be4+ replaces Kb3. After Be4+ Kd4, Bf5 covers d3; after ...Ke5 the central Kc4 step is legally available and r6 switches off, leaving earlier priorities and later tiebreaks to choose the move.

## Known-loop recheck only

Replayed all 183 four-ply cycles from the last complete audit against current preferred White choices. All Black replies and closures in those witnesses remain legal. **99 survive; 84 former cycles are broken.** No full audit or search for newly introduced loops was performed, so 99 is not a new total-loop estimate.

Survivors: 83 completed-r4 bishop shuffles; 7 middle-16 king/knight shuffles; 5 attacked-knight shuffles; 2 other king-protected knight shuffles; 1 opposition/attacked-knight alternation; 1 diagonal-opposition/attacked-knight alternation. The 78-cycle king-shuffle group loses 76 cycles. All seven deferred alternating knight-check/opposition cycles break.

## Validation

TypeScript project check passed. Six focused tests passed, including the loaded position under all eight D4 symmetries and exact r4.6 declarations. Broader bishop/knight suite: 155 passed, 20 failed. An isolated copy with the prior r6 implementation reproduces the same 20 failures; these are existing rule-expectation failures. The new r6 initially interfered with an explicit r4 route; the final guard fixes that regression, and there are no newly failing tests. Every displayed link passed the app decoder, current-policy replay and exact closure.

No commit or push. No full audit.

## Ten surviving examples from the current cohort

These remain in previously deferred groups; included as examples of the known audit cohort, not fresh ordinary-search discoveries.

1. [Nb4+ Kc5 Nd3+ Kc6](http://localhost:5173/mate/bishop-knight#fen=8/K7/B1k5/8/8/3N4/8/8_w_-_-_0_1&moves=Nb4%2B,Kc5,Nd3%2B,Kc6&cursor=0) — Knight shuffle — Other attacked-knight positions
2. [Nd2+ Kc3 Ne4+ Kb3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/4N3/1k6/8/KB6_w_-_-_0_1&moves=Nd2%2B,Kc3,Ne4%2B,Kb3&cursor=0) — Knight shuffle — Other attacked-knight positions
3. [Nb2+ Kc3 Nd1+ Kc4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/K7/B1k5/8/8/3N4_w_-_-_0_1&moves=Nb2%2B,Kc3,Nd1%2B,Kc4&cursor=0) — Knight shuffle — Other attacked-knight positions
4. [Nf2+ Ke3 Ng4+ Kd3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/6N1/3k4/8/2KB4_w_-_-_0_1&moves=Nf2%2B,Ke3,Ng4%2B,Kd3&cursor=0) — Knight shuffle — Other attacked-knight positions
5. [Nc2 Kb3 Nd4+ Kc4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/2kN4/8/8/KB6_w_-_-_0_1&moves=Nc2,Kb3,Nd4%2B,Kc4&cursor=0) — Knight shuffle — Other attacked-knight positions
6. [Kg2 Kf4 Kf1 Ke3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/8/4k3/5N2/5K1B_w_-_-_0_1&moves=Kg2,Kf4,Kf1,Ke3&cursor=0) — King shuffle — Other king-protected knight
7. [Kd2 Ke5 Ke2 Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3k4/3BN3/4K3/8_w_-_-_0_1&moves=Kd2,Ke5,Ke2,Kd4&cursor=0) — King shuffle — Other king-protected knight
8. [Nc2+ Kb3 Nd4+ Ka3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3N4/k7/8/KB6_w_-_-_0_1&moves=Nc2%2B,Kb3,Nd4%2B,Ka3&cursor=0) — Knight shuffle — Black alternates opposition and attacking the knight
9. [Nc2 Kb3 Nd4+ Kc3](http://localhost:5173/mate/bishop-knight#fen=8/8/8/8/3N4/2k5/8/KB6_w_-_-_0_1&moves=Nc2,Kb3,Nd4%2B,Kc3&cursor=0) — Knight shuffle — Black alternates diagonal opposition and attacking the knight
10. [Ke4 Kc4 Ke3 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/2B5/8/1k1N4/4K3/8/8_w_-_-_0_1&moves=Ke4,Kc4,Ke3,Kb4&cursor=0) — King shuffle — King and knight both in middle 16
