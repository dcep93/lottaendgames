# R6 yields to blocked knight drift — 2026-09-26

The reported Nf3 was already ranked as unobstructed by r7, but r6 eliminated it before drift: Ka1 is five king steps from f3 versus four from b5. Black on c3 is adjacent to the initial Nd4 and closer to White's king, so straight distance rewards approaching the blockade again.

R6 now defers when the existing pre-move `knightDriftBlocked` geometry holds: Black adjacent to the knight and closer by king steps to White's king. This is a single applicability condition, shared by all candidates from that start. R7 then ranks the detour. No new move search, path enumeration, square exception, or drift-score changes were introduced. Visible rule wording is unchanged.

The reported position now allows Nf3 and Nc6, tied. Existing Nc1, Nd4, Nc4+, and Na5 detours are restored where the same condition holds. Tests retain normal r6 king approach when the condition does not hold, edge-opposition traps, blocked bishop routes, and all eight D4 transformations.

## Bounded loop check

108 of the previous 136 saved four-ply cycles survive; 28 are eliminated. A five-second mixed search found one additional cycle, for 109 verified witnesses. This is not a new global on-cycle position total. The full-audit baseline remains unchanged.

The largest raw group remains 84 central bishop shuttles, hidden by the all-middle-16 display rule. The largest visible broad motif is unprotected knight shuffling, 11 verified cycles. Only two D4-distinct examples of that motif meet the strict orientation and presentation filters. They are shown with two other examples whose knight stays king-protected. Terminal and degenerate positions are excluded at every ply, White moves are currently preferred, every Black reply is legal, and all examples close exactly.

## Examples

1. [Nb8 Kc7 Na6+ Kd6](http://localhost:5173/mate/bishop-knight#fen=6B1/5K2/N2k4/8/8/8/8/8_w_-_-_0_1&moves=Nb8,Kc7,Na6%2B,Kd6&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
2. [Nb2+ Kc3 Nd1+ Kc4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/K7/B1k5/8/8/3N4_w_-_-_0_1&moves=Nb2%2B,Kc3,Nd1%2B,Kc4&cursor=0) — knight shuffle without king protection; bishop outside center throughout.
3. [Bd3 Kc3 Bb5 Kb4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1B6/1k1NK3/8/8/8_w_-_-_0_1&moves=Bd3,Kc3,Bb5,Kb4&cursor=0) — minor-piece shuffle while knight remains king-protected.
4. [Nc7+ Kc5 Na6+ Kb5](http://localhost:5173/mate/bishop-knight#fen=B7/1K6/N7/1k6/8/8/8/8_w_-_-_0_1&moves=Nc7%2B,Kc5,Na6%2B,Kb5&cursor=0) — minor-piece shuffle while knight remains king-protected.

## Validation

58 targeted tests, 39 audit-harness tests, and the production TypeScript/Vite build pass. The final test edits also pass TypeScript compilation.
