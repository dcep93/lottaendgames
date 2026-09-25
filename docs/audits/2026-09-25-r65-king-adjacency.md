# r6.5: save the bishop by moving next to White king

Prefer a bishop move that establishes White king protection. Those moves tie at r6.5, allowing later rules to decide. Otherwise maximize bishop Euclidean distance from Black’s king. Preserve the exemption for a bishop already king-defended before moving. Update rule text exactly as requested.

The change reuses the existing attacked-bishop defense score, with a bishop-move requirement. Tests cover both defended landings with different Black distances, a farther undefended alternative, a king move that establishes defense, inactive cases, and all D4 orientations. All 15 targeted tests and the production build pass. Broad suite: 134 pass; the same four pre-existing failures remain.

Saved four-ply replay: 67 of the original 2,467 witnesses survive, down from 77. All ten previously displayed bishop shuffles are broken. No recorded cycles reactivated. This is not a new full-domain total and does not measure new or longer cycles.

The display filter hides 64 cycles whose White pieces remain in the middle 16 in both White-to-move positions. Only three saved witnesses are eligible to display: two knight shuffles and one king shuffle. Therefore a ten-plus-two set is unavailable in this cohort.

## All eligible verified examples

1. [Nc6+ Ka8 Nb4 Ka7](http://localhost:5173/mate/bishop-knight#fen=8/k7/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Ka7&cursor=0)
2. [Nc6+ Ka8 Nb4 Kb8](http://localhost:5173/mate/bishop-knight#fen=1k6/8/B7/1K6/1N6/8/8/8_w_-_-_0_1&moves=Nc6%2B,Ka8,Nb4,Kb8&cursor=0)
3. [Kb7 Kd6 Ka6 Kc5](http://localhost:5173/mate/bishop-knight#fen=B7/8/KN6/2k5/8/8/8/8_w_-_-_0_1&moves=Kb7,Kd6,Ka6,Kc5&cursor=0)
