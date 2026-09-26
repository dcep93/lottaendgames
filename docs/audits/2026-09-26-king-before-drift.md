# King before knight drift — bounded check, 2026-09-26

Swapped r6 and r7. King proximity is now r6; knight drift is now r7. Scoring is unchanged; rule order, labels, help, and test references were updated. Earlier r4/r4.5/r5 priorities remain ahead of both. Consequently king approach may now outrank an otherwise viable drift route (Ke2 over Nc1, Kb6 over Nd4); the drift geometry tests remain intact.

58 focused tests and production build passed. Tests cover all eight board symmetries. The loaded Be8/Na6/Kg5/Black Ke6 placement chooses Ba4 under an earlier priority.

70 of the last full audit's 583 four-ply witnesses survive, 513 break. Five-second mixed sampling checked 254 roots (253 completed), finding 28 witnesses, three additional, for 73 verified witnesses. Not an exhaustive current-domain count or density estimate; full-audit baseline unchanged.

Largest observed rule pair: r4/r4, 68 witnesses. Only one example in this checked set satisfies all current terminal/degenerate, middle-16 display, and orientation filters, so a 10+2 selection is unavailable. All provided examples use preferred White moves and legal Black replies and are D4/phase-deduplicated.

1. [r6 ↔ r7: Nc6+ Ka8 Nb4 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Kb8&cursor=0)
