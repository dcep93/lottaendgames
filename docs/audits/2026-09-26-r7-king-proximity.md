# R7 king proximity — 2026-09-26

Replace r7's final opposite-bishop-color preference with Euclidean proximity to Black's king. Preserve king step proximity to the knight, then Euclidean proximity to the nearest central-four square. Update modal text and notes. No other rule priority changes.

The earlier Ba4/Ne4/Ke3/kd5 example now prefers Kd3 under r7, before r8 can select Bb3+. Tests retain r8's isolated preference for Bb3+ while asserting the new overall ordering. D4 tests verify the new distance tiebreak and earlier priorities. Build and 28 focused tests pass.

Both previously reported four-ply cycles break. Replay of all 15,917 saved witnesses leaves zero survivors. Five seconds of biased discovery checked 402 roots and found no additional cycles. This does not establish zero cycles over the full domain. No fresh full graph audit was requested or performed; its pointer remains unchanged. No verified loop links are available for this turn.
